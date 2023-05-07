import fetchAdapter from "@vespaiach/axios-fetch-adapter"
import type { AxiosInstance, AxiosRequestConfig } from "axios"
import axios, { AxiosError } from "axios"
import axiosRetry, { exponentialDelay } from "axios-retry"
import objectHash from "object-hash"
import { type ChatMessage, ErrorCode } from "window.ai"

import { definedValues, parseDataChunks } from "~core/utils/utils"

// These options are specific to the model shape and archetype
export interface ModelConfig {
  defaultBaseUrl: string
  modelProvider: string
  isStreamable: boolean
  getPath: (request: RequestData) => string
  transformForRequest: (
    request: RequestData,
    meta: RequestMetadata
  ) => Record<string, unknown>
  transformResponse: (res: unknown) => string[]

  // Optionals
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
  frequency_penalty?: number
  presence_penalty?: number
  top_p?: number
  stop_sequences?: string[]
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
  "user_identifier" | "timeout" | "apiKey" | "origin" | "adapter" // These do not affect output of the model
> &
  Pick<Required<ModelConfig>, "modelProvider"> & // To distinguish btw providers with same-name models
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
      apiKey: null,
      timeout: 25000,
      user_identifier: null,
      frequency_penalty: 0,
      presence_penalty: 0,
      temperature: 0, // OpenAI defaults to 1
      top_p: 1, // OpenAI default, rec. not change unless temperature = 1
      stop_sequences: [], // OpenAI default
      num_generations: 1,
      max_tokens: 16, // OpenAI default, low for safety
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
          axiosRetry.isRetryableError(error) ||
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
      overrideModelParam:
        config.overrideModelParam || ((request: RequestData) => request.model),
      cacheGet: config.cacheGet || (() => Promise.resolve(undefined)),
      cacheSet: config.cacheSet || (() => Promise.resolve(undefined))
    }
    return opts
  }

  log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[MODEL ${this.config.modelProvider}]: `, ...args)
    }
  }

  error(...args: unknown[]): void {
    if (this.config.debug) {
      console.error(`[MODEL ${this.config.modelProvider}]: `, ...args)
    }
  }

  getRequestIdentifierData(
    requestPrompt: RequestPrompt,
    opts: Required<RequestOptions>
  ): RequestData {
    const ret = {
      ...requestPrompt,
      model: opts.model,
      modelProvider: this.config.modelProvider,
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

  async complete(
    requestPrompt: RequestPrompt,
    requestOpts: RequestOptions = {}
  ): Promise<string[]> {
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
      return cached
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
      if (!(err instanceof AxiosError)) {
        this.error(`Unknown error: ${err}`)
        throw err
      }
      const errMessage = `${err.response?.status}: ${err}`
      this.error(errMessage + "\n" + err.response?.data)
      throw new Error(ErrorCode.ModelRejectedRequest + ": " + errMessage)
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
    return result
  }

  async stream(
    requestPrompt: RequestPrompt,
    requestOpts: RequestOptions = {}
  ): Promise<ReadableStream<string>> {
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

      return response.data.pipeThrough(transformStream)
    } catch (err: unknown) {
      if (!(err instanceof AxiosError)) {
        this.error(`Unknown error: ${err}`)
        throw err
      }
      const errMessage = `${err.response?.status}: ${err}`
      this.error(errMessage + "\n" + err.response?.data)
      throw new Error(ErrorCode.ModelRejectedRequest + ": " + errMessage)
    }
  }

  protected _getRequestHeaders(opts: Required<RequestOptions>) {
    const { authPrefix } = this.config
    return {
      Authorization: `${authPrefix}${opts.apiKey || ""}`,
      "HTTP-Referer": opts.origin
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
}
