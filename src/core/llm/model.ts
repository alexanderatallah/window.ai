import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import axiosRetry, { exponentialDelay } from "axios-retry"
import objectHash from "object-hash"
import { Readable, Transform, TransformCallback } from "stream"

import { IS_SERVER } from "~core/constants"
import { parseDataChunks } from "~core/utils/utils"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ModelConfig {
  baseUrl: string
  modelProvider: string
  modelId: string
  customHeaders?: Record<string, string>
  authPrefix?: string
  debug?: boolean
  retries?: number
  quality?: "low" | "max" // defaults to 'max'
  endOfStreamSentinel?: string | null
  cacheGet?: CacheGetter
  cacheSet?: CacheSetter
  getPath: (request: RequestData) => string
  transformForRequest: (
    request: RequestData,
    meta: RequestMetadata
  ) => Record<string, unknown>
  transformResponse: (res: unknown) => string
}

export interface RequestOptions {
  apiKey?: string | null
  frequency_penalty?: number
  presence_penalty?: number
  top_p?: number
  stop_sequences?: string[]
  temperature?: number
  timeout?: number
  user_identifier?: string | null
  max_tokens?: number | null
  stream?: boolean
  adapter?: AxiosRequestConfig["adapter"] | null
}

export type RequestPrompt =
  | { prompt: string; suffix?: string }
  | { messages: ChatMessage[] }

export type RequestData = Omit<
  Required<RequestOptions>,
  "user_identifier" | "timeout" | "apiKey" | "adapter"
> &
  Pick<Required<ModelConfig>, "modelId" | "modelProvider"> &
  RequestPrompt

export type RequestMetadata = Pick<RequestOptions, "user_identifier">

// TODO cache statistics and log probs etc
export type CacheGetter = (id: string) => Promise<string | null | undefined>

export type CacheSetter = (data: {
  id: string
  prompt: RequestData
  completion: string
}) => Promise<unknown>

export class Model {
  public api: AxiosInstance
  public config: Required<ModelConfig>
  public options: Required<RequestOptions>

  constructor(config: ModelConfig, opts: RequestOptions = {}) {
    // Defaults
    this.config = this.addDefaults(config)
    this.options = {
      apiKey: null,
      timeout: 25000,
      user_identifier: null,
      frequency_penalty: 0,
      presence_penalty: 0,
      temperature: 0, // OpenAI defaults to 1
      top_p: 1, // OpenAI default, rec. not change unless temperature = 1
      stop_sequences: [], // OpenAI default
      max_tokens: 16, // OpenAI default, low for safety
      stream: false,
      adapter: null,
      ...opts
    }
    // Create API client
    this.api = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...this.config.customHeaders
      },
      adapter: this.options.adapter || undefined
    })
    axiosRetry(this.api, {
      retries: this.config.retries,
      retryDelay: exponentialDelay
    })
  }

  get identifier(): string {
    return `${this.config.modelProvider}.${this.config.modelId}`
  }

  addDefaults(config: ModelConfig): Required<ModelConfig> {
    const opts: Required<ModelConfig> = {
      quality: "max",
      authPrefix: "Bearer ",
      retries: 3,
      debug: true,
      customHeaders: {},
      endOfStreamSentinel: null,
      ...config,
      cacheGet: config.cacheGet || (() => Promise.resolve(undefined)),
      cacheSet: config.cacheSet || (() => Promise.resolve(undefined))
    }
    return opts
  }

  log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[MODEL ${this.identifier}]: `, ...args)
    }
  }

  error(...args: unknown[]): void {
    if (this.config.debug) {
      console.error(`[MODEL ${this.identifier}]: `, ...args)
    }
  }

  getRequestIdentifierData(
    requestPrompt: RequestPrompt,
    opts: Required<RequestOptions>
  ): RequestData {
    return {
      ...requestPrompt,
      modelId: this.config.modelId,
      modelProvider: this.config.modelProvider,
      temperature: opts.temperature,
      top_p: opts.top_p,
      frequency_penalty: opts.frequency_penalty,
      presence_penalty: opts.presence_penalty,
      stop_sequences: opts.stop_sequences,
      max_tokens: opts.max_tokens,
      stream: opts.stream
    }
  }

  async complete(
    requestPrompt: RequestPrompt,
    requestOpts: RequestOptions = {}
  ): Promise<string> {
    const {
      transformForRequest,
      getPath,
      cacheGet,
      cacheSet,
      transformResponse,
      authPrefix
    } = this.config
    const opts: Required<RequestOptions> = {
      ...this.options,
      ...requestOpts
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
      suffix: payload["suffix"],
      max_tokens: payload["max_tokens"],
      stop_sequences: payload["stop_sequences"]
    })
    let responseData: Record<string, any>
    try {
      const response = await this.api.post(getPath(request), payload, {
        timeout: opts.timeout,
        headers: {
          Authorization: `${authPrefix}${opts.apiKey}`
        }
      })
      responseData = response.data
    } catch (err: unknown) {
      const asResponse = err as any
      this.error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
        `ERROR ${asResponse.response?.statusText} for id ${id}:`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        asResponse.response?.data || asResponse.message
      )
      throw err
    }

    this.log("RESPONSE for id " + id)
    const result = transformResponse(responseData)
    if (!result) {
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
  ): Promise<Readable | ReadableStream> {
    const opts: Required<RequestOptions> = {
      ...this.options,
      ...requestOpts,
      stream: true
    }
    const { transformResponse, transformForRequest, authPrefix, getPath } =
      this.config
    const request = this.getRequestIdentifierData(requestPrompt, opts)
    const id = objectHash(request)
    const promptSnippet = JSON.stringify(requestPrompt).slice(0, 100)
    const payload = transformForRequest(request, opts)
    this.log(`STREAMING id ${id}: ${promptSnippet}...`, {
      suffix: payload["suffix"],
      max_tokens: payload["max_tokens"],
      stop_sequences: payload["stop_sequences"],
      stream: payload["stream"]
    })

    let stream: Readable | ReadableStream
    try {
      // HACK due to Node.js not matching browser APIs
      // TODO consolidate onto the browser only?
      if (IS_SERVER) {
        const response = await this.api.post<Readable>(
          getPath(request),
          payload,
          {
            timeout: opts.timeout,
            responseType: "stream",
            headers: {
              Authorization: `${authPrefix}${opts.apiKey}`
            }
          }
        )
        // Transform all data chunks using transformResponse
        stream = response.data.pipe(
          new Transform({
            transform: (chunk, encoding, callback: TransformCallback) => {
              this._executeTransform(chunk, transformResponse, {
                onEnd: () => callback(null, null),
                onError: (err) => callback(err, null),
                onResult: (result) => callback(null, result)
              })
            }
          })
        )
      } else {
        const response = await this.api.post<ReadableStream>(
          getPath(request),
          payload,
          {
            timeout: opts.timeout,
            responseType: "stream",
            headers: {
              Authorization: `${authPrefix}${opts.apiKey}`
            }
          }
        )

        const transformStream = new TransformStream({
          transform: (chunk, controller) => {
            this._executeTransform(chunk, transformResponse, {
              onEnd: () => controller.terminate(),
              onError: (err) => controller.error(err),
              onResult: (result) => controller.enqueue(result)
            })
          }
        })

        stream = response.data.pipeThrough(transformStream)
      }
    } catch (err: unknown) {
      const asResponse = err as { response: AxiosResponse }
      this.error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
        `ERROR ${asResponse.response?.statusText} for id ${id}:`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        asResponse.response?.data || (err as Error).message
      )
      // TODO handle better along with complete()
      throw err
    }
    return stream
  }

  private _executeTransform(
    chunk: BufferSource,
    transformResponse: (responseData: Record<string, any>) => string,
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
    const chunkStr = new TextDecoder().decode(chunk)
    for (const chunkDataRes of parseDataChunks(chunkStr)) {
      if (chunkDataRes === this.config.endOfStreamSentinel) {
        this.log("End:", chunkDataRes)
        onEnd()
      } else if (!chunkDataRes) {
        const e = new Error(`Returned no data: ${chunkStr}`)
        this.error(e)
        onError(e)
      } else {
        const chunkData = JSON.parse(chunkDataRes)
        const result = transformResponse(chunkData)
        if (!result) {
          const e = new Error(`Returned empty data: ${chunkDataRes}`)
          this.error(e)
          onError(e)
        } else {
          this.log("Result: ", result)
          onResult(result)
        }
      }
    }
  }
}
