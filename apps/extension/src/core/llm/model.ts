import fetchAdapter from "@vespaiach/axios-fetch-adapter"
import type { AxiosInstance, AxiosRequestConfig } from "axios"
import axios, { AxiosError } from "axios"
import axiosRetry, { exponentialDelay } from "axios-retry"
import objectHash from "object-hash"
import { type ChatMessage, ErrorCode } from "window.ai"

import { type Err, type Result, err, ok } from "~core/utils/result-monad"
import { definedValues, parseDataChunks } from "~core/utils/utils"

// These options are specific to the model shape and archetype
export interface ModelConfig {
  defaultBaseUrl: string
  identifier: string
  isStreamable: boolean
  getPath: (request: RequestData) => string
  transformForRequest: (
    request: RequestData,
    meta: RequestMetadata
  ) => Record<string, unknown>
  transformResponse: (res: unknown) => string[]

  // Optionals
  getRoutePath?: (request: RequestData) => string | null
  overrideModelParam?: (request: RequestData) => string | null
  customHeaders?: Record<string, string>
  authPrefix?: string
  debug?: boolean
  retries?: number
  endOfStreamSentinel?: string | null
  cacheGet?: CacheGetter
  cacheSet?: CacheSetter
  adapter?: AxiosRequestConfig["adapter"]
}

export interface RequestOptions {
  baseUrl?: string
  apiKey?: string | null
  model?: string | null
  origin?: string | null
  originTitle?: string | null
  frequency_penalty?: number
  presence_penalty?: number
  top_p?: number
  stop_sequences?: string[] | null
  num_generations?: number
  temperature?: number
  timeout?: number
  user_identifier?: string | null
  max_tokens?: number | null
  stream?: boolean
  adapter?: AxiosRequestConfig["adapter"] | null
}

type RequestPromptBasic = { prompt: string; suffix?: string }
type RequestPromptChat = { messages: ChatMessage[] }

export interface RequestPrompt
  extends Partial<RequestPromptBasic>,
    Partial<RequestPromptChat> {}

export type RequestData = Omit<
  Required<RequestOptions>,
  | "user_identifier"
  | "timeout"
  | "apiKey"
  | "origin"
  | "originTitle"
  | "adapter" // These do not affect output of the model
> &
  Pick<Required<ModelConfig>, "identifier"> & // To distinguish btw providers with same-name models
  RequestPrompt

export type RequestMetadata = Pick<RequestOptions, "user_identifier">

// TODO cache statistics and log probs etc
export type CacheGetter = (id: string) => Promise<string[] | null | undefined>

export type CacheSetter = (data: {
  id: string
  prompt: RequestData
  completion: string[]
}) => Promise<unknown>

export class Model {
  public api: AxiosInstance
  public config: Required<ModelConfig>
  public defaultOptions: Required<RequestOptions>

  constructor(config: ModelConfig, opts: RequestOptions = {}) {
    // Defaults
    this.config = this.addDefaults(config)
    this.defaultOptions = {
      baseUrl: this.config.defaultBaseUrl,
      model: null,
      origin: null,
      originTitle: null,
      apiKey: null,
      timeout: 42000,
      user_identifier: null,
      frequency_penalty: 0,
      presence_penalty: 0,
      temperature: 0, // OpenAI defaults to 1
      top_p: 1, // OpenAI default, rec. not change unless temperature = 1
      stop_sequences: null, // OpenAI default
      num_generations: 1,
      max_tokens: null,
      stream: false,
      adapter: null,
      ...definedValues(opts)
    }
    // Create API client
    this.api = axios.create({
      baseURL: this.defaultOptions.baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...this.config.customHeaders
      },
      adapter: this.config.adapter || undefined
    })
    axiosRetry(this.api, {
      retries: this.config.retries,
      retryDelay: exponentialDelay,
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkError(error) ||
          // axiosRetry.isRetryableError(error) ||
          error.code === "ECONNABORTED" ||
          error.response?.status === 429
        )
      }
    })
  }

  addDefaults(config: ModelConfig): Required<ModelConfig> {
    const opts: Required<ModelConfig> = {
      authPrefix: "Bearer ",
      retries: 5,
      debug: true,
      customHeaders: {},
      endOfStreamSentinel: null,
      adapter: fetchAdapter,
      ...definedValues(config),
      // Functions throw a ts error when placed above the spread
      getRoutePath: config.getRoutePath || ((request: RequestData) => null),
      overrideModelParam:
        config.overrideModelParam || ((request: RequestData) => request.model),
      cacheGet: config.cacheGet || (() => Promise.resolve(undefined)),
      cacheSet: config.cacheSet || (() => Promise.resolve(undefined))
    }
    return opts
  }

  log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[MODEL ${this.config.identifier}]: `, ...args)
    }
  }

  error(...args: unknown[]): void {
    if (this.config.debug) {
      console.error(`[MODEL ${this.config.identifier}]: `, ...args)
    }
  }

  getRequestIdentifierData(
    requestPrompt: RequestPrompt,
    opts: Required<RequestOptions>
  ): RequestData {
    const ret = {
      ...requestPrompt,
      model: opts.model,
      identifier: this.config.identifier,
      temperature: opts.temperature,
      top_p: opts.top_p,
      frequency_penalty: opts.frequency_penalty,
      presence_penalty: opts.presence_penalty,
      stop_sequences: opts.stop_sequences,
      num_generations: opts.num_generations,
      max_tokens: opts.max_tokens,
      stream: opts.stream,
      baseUrl: opts.baseUrl
    }
    return {
      ...ret,
      model: this.config.overrideModelParam(ret)
    }
  }

  async route(
    requestPrompt: RequestPrompt,
    requestOpts: RequestOptions = {}
  ): Promise<Result<string, ErrorCode>> {
    const { transformForRequest, getRoutePath } = this.config
    const opts: Required<RequestOptions> = {
      ...this.defaultOptions,
      ...definedValues(requestOpts)
    }
    const request = this.getRequestIdentifierData(requestPrompt, opts)
    const modelRoutePath = getRoutePath(request)
    if (!modelRoutePath) {
      const e = new Error(
        `No model route path found for model ${this.config.identifier}`
      )
      this.error(e)
      throw e
    }
    const promptSnippet = JSON.stringify(requestPrompt).slice(0, 100)
    const payload = transformForRequest(request, opts)
    this.log(`ROUTING: ${promptSnippet}...`, {
      modelId: request.model,
      suffix: payload["suffix"],
      max_tokens: payload["max_tokens"],
      stop_sequences: payload["stop_sequences"]
    })
    let responseData: Record<string, any>
    try {
      const response = await this.api.post(modelRoutePath, payload, {
        baseURL: opts.baseUrl,
        timeout: opts.timeout,
        headers: this._getRequestHeaders(opts)
      })
      responseData = response.data
    } catch (err: unknown) {
      return this._handleModelAPIError(err)
    }

    const model = responseData.id
    if (typeof model !== "string") {
      const e = new Error(`Invalid response: ${JSON.stringify(responseData)}`)
      this.error(e)
      throw e
    }
    return ok(model)
  }

  async complete(
    requestPrompt: RequestPrompt,
    requestOpts: RequestOptions = {}
  ): Promise<Result<string[], ErrorCode>> {
    const {
      transformForRequest,
      getPath,
      cacheGet,
      cacheSet,
      transformResponse
    } = this.config
    const opts: Required<RequestOptions> = {
      ...this.defaultOptions,
      ...definedValues(requestOpts)
    }
    const request = this.getRequestIdentifierData(requestPrompt, opts)
    const id = objectHash(request)
    const promptSnippet = JSON.stringify(requestPrompt).slice(0, 100)
    const cached = await cacheGet(id)
    if (cached) {
      this.log(`\nCACHE HIT for id ${id}: ${promptSnippet}...`)
      return ok(cached)
    }
    const payload = transformForRequest(request, opts)
    this.log(`COMPLETING id ${id}: ${promptSnippet}...`, {
      modelId: request.model,
      suffix: payload["suffix"],
      max_tokens: payload["max_tokens"],
      stop_sequences: payload["stop_sequences"]
    })
    let responseData: Record<string, any>
    try {
      const response = await this.api.post(getPath(request), payload, {
        baseURL: opts.baseUrl,
        timeout: opts.timeout,
        headers: this._getRequestHeaders(opts)
      })
      responseData = response.data
    } catch (err: unknown) {
      return this._handleModelAPIError(err)
    }

    this.log("RESPONSE for id " + id)
    const result = transformResponse(responseData)
    if (!result[0]) {
      const e = new Error(
        `Returned an empty result: ${JSON.stringify(responseData)}`
      )
      this.error(e)
      throw e
    }

    await cacheSet({
      id,
      prompt: request,
      completion: result
    })
    this.log("SAVED TO CACHE: " + id)
    return ok(result)
  }

  async stream(
    requestPrompt: RequestPrompt,
    requestOpts: RequestOptions = {}
  ): Promise<Result<ReadableStream<string>, ErrorCode>> {
    const opts: Required<RequestOptions> = {
      ...this.defaultOptions,
      ...definedValues(requestOpts),
      stream: true
    }
    const { transformResponse, transformForRequest, getPath } = this.config
    const request = this.getRequestIdentifierData(requestPrompt, opts)
    const id = objectHash(request)
    const promptSnippet = JSON.stringify(requestPrompt).slice(0, 100)
    const payload = transformForRequest(request, opts)
    this.log(`STREAMING id ${id}: ${promptSnippet}...`, {
      modelId: request.model,
      suffix: payload["suffix"],
      max_tokens: payload["max_tokens"],
      stop_sequences: payload["stop_sequences"],
      stream: payload["stream"]
    })
    try {
      const response = await this.api.post<ReadableStream<string>>(
        getPath(request),
        payload,
        {
          baseURL: opts.baseUrl,
          timeout: opts.timeout,
          responseType: "stream",
          headers: this._getRequestHeaders(opts)
        }
      )

      const decoder = new TextDecoder()
      const transformStream = new TransformStream({
        transform: (chunk, controller) => {
          const chunkStr = decoder.decode(chunk)
          this._executeTransform(chunkStr, transformResponse, {
            onEnd: () => controller.terminate(),
            onError: (err) => controller.error(err),
            onResult: (result) => controller.enqueue(result)
          })
        }
      })

      return ok(response.data.pipeThrough(transformStream))
    } catch (err: unknown) {
      return this._handleModelAPIError(err)
    }
  }

  protected _getRequestHeaders(opts: Required<RequestOptions>) {
    const { authPrefix } = this.config
    return {
      Authorization: opts.apiKey ? `${authPrefix}${opts.apiKey}` : undefined,
      "X-API-KEY": opts.apiKey || undefined,
      "HTTP-Referer": opts.origin,
      "X-WINDOWAI-TITLE": opts.originTitle
    }
  }

  private _executeTransform(
    chunkStr: string,
    transformResponse: (responseData: Record<string, any>) => string[],
    {
      onEnd,
      onError,
      onResult
    }: {
      onEnd: () => void
      onError: (err: Error) => void
      onResult: (result: string) => void
    }
  ) {
    let fullResult = ""
    // this.log("Batched chunk: ", chunkStr)
    const chunks = parseDataChunks(chunkStr)
    if (chunks.length > 1) {
      this.log("Batched chunk: ", chunkStr)
    }
    for (const chunkDataRes of chunks) {
      if (chunkDataRes === this.config.endOfStreamSentinel) {
        this.log(
          "End: ",
          chunkDataRes,
          "Full chunk: ",
          chunkStr,
          "Running result: ",
          fullResult
        )
        if (fullResult) {
          // The last data is empty and just has the finish_reason,
          // but there might have been data earlier in the chunk
          onResult(fullResult)
        }
        onEnd()
        return
      } else {
        const chunkData = JSON.parse(chunkDataRes)
        const result = transformResponse(chunkData)
        if (typeof result[0] !== "string") {
          const e = new Error(`Returned empty data: ${chunkDataRes}`)
          this.error(e)
          onError(e)
          return
        } else {
          this.log("Result: ", result)
          fullResult += result
        }
      }
    }
    onResult(fullResult)
  }

  private _handleModelAPIError(error: unknown): Err<ErrorCode> {
    if (!(error instanceof AxiosError)) {
      const errorStr = `Unknown error: ${error}`
      this.error(errorStr)
      throw new Error(errorStr)
    }
    // Network errors are like auth errors when interacting with localhost
    const isNetworkError = error.code === "ERR_NETWORK"
    if (error.response?.status === 401 || isNetworkError) {
      return err(ErrorCode.NotAuthenticated)
    }
    if (error.response?.status === 402) {
      return err(ErrorCode.PaymentRequired)
    }
    const errMessage = `${error.response?.status}: ${error}`
    this.error(
      `Unknown Axios error: ` + errMessage + "\n" + error.response?.data
    )
    throw new Error(ErrorCode.ModelRejectedRequest + ": " + errMessage)
  }
}
