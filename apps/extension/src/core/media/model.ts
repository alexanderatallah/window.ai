import fetchAdapter from "@vespaiach/axios-fetch-adapter"
import type { AxiosInstance, AxiosRequestConfig } from "axios"
import axios, { AxiosError } from "axios"
import axiosRetry, { exponentialDelay } from "axios-retry"
import objectHash from "object-hash"
import { type ChatMessage, ErrorCode, MediaType, type MediaOutput } from "window.ai"

import { type Err, type Result, err, ok } from "~core/utils/result-monad"
import { definedValues, parseDataChunks } from "~core/utils/utils"

// These options are specific to the model shape and archetype
export interface MediaModelConfig {
  defaultBaseUrl: string
  identifier: string
  getPath: (request: RequestData) => string
  transformForRequest: (
    request: RequestData,
    meta: RequestMetadata
  ) => Record<string, unknown>
  transformResponse: (res: unknown) => MediaOutput[]

  // Optionals
  getRoutePath?: (request: RequestData) => string | null
  overrideModelParam?: (request: RequestData) => string | null
  customHeaders?: Record<string, string>
  authPrefix?: string
  debug?: boolean
  retries?: number
//   endOfStreamSentinel?: string | null
  cacheGet?: CacheGetter
  cacheSet?: CacheSetter
  adapter?: AxiosRequestConfig["adapter"]
}

export interface RequestOptions {
  baseUrl?: string
  apiKey?: string | null
  model?: string | null
  origin?: string | null
//   frequency_penalty?: number
//   presence_penalty?: number
//   top_p?: number
//   stop_sequences?: MediaOutput[] | null
  num_generations?: number
  num_inference_steps?:number
  type?: MediaType
//   temperature?: number
  timeout?: number
  user_identifier?: string | null
//   max_tokens?: number | null
//   stream?: boolean
  adapter?: AxiosRequestConfig["adapter"] | null
}

type RequestPrompt = { prompt: string; }

// export interface RequestPrompt extends Partial<RequestPromptBasic>

export type RequestData = Omit<
  Required<RequestOptions>,
  "user_identifier" | "timeout" | "apiKey" | "origin" | "adapter" // These do not affect output of the model
> &
  Pick<Required<MediaModelConfig>, "identifier"> & // To distinguish btw providers with same-name models
  RequestPrompt

export type RequestMetadata = Pick<RequestOptions, "user_identifier">

// TODO cache statistics and log probs etc
export type CacheGetter = (id: string) => Promise<MediaOutput[] | null | undefined>

export type CacheSetter = (data: {
  id: string
  prompt: RequestData
  completion: MediaOutput[]
}) => Promise<unknown>

export class MediaModel {
  public api: AxiosInstance
  public config: Required<MediaModelConfig>
  public defaultOptions: Required<RequestOptions>

  constructor(config: MediaModelConfig, opts: RequestOptions = {}) {
    // Defaults
    this.config = this.addDefaults(config)
    this.defaultOptions = {
      baseUrl: this.config.defaultBaseUrl,
      model: null,
      origin: null,
      apiKey: null,
      timeout: 60000,
      user_identifier: null,
      num_generations: 1,
      type: MediaType.Object,
      num_inference_steps: 32,
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

  addDefaults(config: MediaModelConfig): Required<MediaModelConfig> {
    const opts: Required<MediaModelConfig> = {
      authPrefix: "Bearer ",
      retries: 5,
      debug: true,
      customHeaders: {},
    //   endOfStreamSentinel: null,
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
      console.log(`[MEDIA_MODEL ${this.config.identifier}]: `, ...args)
    }
  }

  error(...args: unknown[]): void {
    if (this.config.debug) {
      console.error(`[MEDIA_MODEL ${this.config.identifier}]: `, ...args)
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
    //   temperature: opts.temperature,
    //   top_p: opts.top_p,
    //   frequency_penalty: opts.frequency_penalty,
    //   presence_penalty: opts.presence_penalty,
    //   stop_sequences: opts.stop_sequences,
      num_generations: opts.num_generations,
      type: opts.type,
      num_inference_steps: opts.num_inference_steps,
    //   max_tokens: opts.max_tokens,
    //   stream: opts.stream,
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
    //   suffix: payload["suffix"],
    //   max_tokens: payload["max_tokens"],
    //   stop_sequences: payload["stop_sequences"]
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
  ): Promise<Result<MediaOutput[], ErrorCode>> {
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
    //   suffix: payload["suffix"],
    //   max_tokens: payload["max_tokens"],
    //   stop_sequences: payload["stop_sequences"]
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
    // return ok([responseData.url]);
    const result = transformResponse(responseData)
    if (!result[0]) {
      const e = new Error(
        `Returned an empty result: ${JSON.stringify(responseData)}`
      )
      this.error(e)
      throw e
    }
    // TODO: Look at cache because devs might want images to be regenerated w the same prompt
    await cacheSet({
      id,
      prompt: request,
      completion: result
    })
    this.log("SAVED TO CACHE: " + id)
    return ok(result)
  }



  protected _getRequestHeaders(opts: Required<RequestOptions>) {
    const { authPrefix } = this.config
    return {
      Authorization: opts.apiKey ? `${authPrefix}${opts.apiKey}` : undefined,
      "X-API-KEY": opts.apiKey || undefined,
      "HTTP-Referer": opts.origin
    }
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