import fetchAdapter from "@vespaiach/axios-fetch-adapter"
import type { AxiosInstance, AxiosRequestConfig } from "axios"
import axios, { AxiosError } from "axios"
import axiosRetry, { exponentialDelay } from "axios-retry"
import objectHash from "object-hash"
import { ErrorCode, MediaExtension, type MediaOutput } from "window.ai"

import { type Err, type Result, err, ok } from "~core/utils/result-monad"
import { definedValues } from "~core/utils/utils"

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
  adapter?: AxiosRequestConfig["adapter"]
}

export interface RequestOptions {
  baseUrl?: string
  apiKey?: string | null
  model?: string | null
  origin?: string | null
  num_generations?: number
  extension?: MediaExtension | null
  num_inference_steps?: number | null
  timeout?: number
  user_identifier?: string | null
  adapter?: AxiosRequestConfig["adapter"] | null
}

type RequestPrompt = { prompt: string }

// export interface RequestPrompt extends Partial<RequestPromptBasic>

export type RequestData = Omit<
  Required<RequestOptions>,
  "user_identifier" | "timeout" | "apiKey" | "origin" | "adapter" // These do not affect output of the model
> &
  Pick<Required<MediaModelConfig>, "identifier"> & // To distinguish btw providers with same-name models
  RequestPrompt

export type RequestMetadata = Pick<RequestOptions, "user_identifier">

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
      num_inference_steps: 32,
      extension: null,
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

  addDefaults(config: MediaModelConfig): Required<MediaModelConfig> {
    const opts: Required<MediaModelConfig> = {
      authPrefix: "Bearer ",
      retries: 5,
      debug: true,
      customHeaders: {},
      adapter: fetchAdapter,
      ...definedValues(config),
      // Functions throw a ts error when placed above the spread
      getRoutePath: config.getRoutePath || ((request: RequestData) => null),
      overrideModelParam:
        config.overrideModelParam || ((request: RequestData) => request.model)
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
      num_generations: opts.num_generations,
      num_inference_steps: opts.num_inference_steps,
      extension: opts.extension,
      baseUrl: opts.baseUrl
    }
    return {
      ...ret,
      model: this.config.overrideModelParam(ret)
    }
  }

  async generate(
    requestPrompt: RequestPrompt,
    requestOpts: RequestOptions = {}
  ): Promise<Result<MediaOutput[], ErrorCode>> {
    const { transformForRequest, getPath, transformResponse } = this.config
    const opts: Required<RequestOptions> = {
      ...this.defaultOptions,
      ...definedValues(requestOpts)
    }
    const request = this.getRequestIdentifierData(requestPrompt, opts)
    const id = objectHash(request)
    const promptSnippet = JSON.stringify(requestPrompt).slice(0, 100)
    const payload = transformForRequest(request, opts)
    this.log(`COMPLETING id ${id}: ${promptSnippet}...`, {
      modelId: request.model
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
  // TODO: Duplicated from llm/model.ts, abstract out to a common place
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
