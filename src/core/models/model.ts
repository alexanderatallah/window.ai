import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import axiosRetry, { exponentialDelay } from "axios-retry"
import objectHash from "object-hash"
import { Readable, Transform, TransformCallback } from "stream"

import { IS_SERVER } from "~core/constants"
import { parseDataChunks } from "~core/utils"

export interface ModelConfig {
  baseUrl: string
  generationPath: string
  streamPath?: string
  apiKey: string
  modelProvider: string
  modelId: string
  customHeaders?: Record<string, string>
  authPrefix?: string
  debug?: boolean
  retries?: number
  quality?: "low" | "max" // defaults to 'max'
  cacheGet?: CacheGetter
  cacheSet?: CacheSetter
  transformForRequest: (
    prompt: RequestData,
    meta: RequestMetadata
  ) => Record<string, unknown>
  transformResponse: (res: Record<string, any> | string) => string
}

export interface ModelOptions {
  frequency_penalty?: number
  presence_penalty?: number
  top_p?: number
  stop_sequences?: string | string[] | null
  temperature?: number
  timeout?: number
  user_identifier?: string | null
  max_tokens?: number
  stream?: boolean
  adapter?: AxiosRequestConfig["adapter"]
}

export type RequestPrompt = { prompt: string; suffix?: string }

export type RequestData = Omit<
  Required<ModelOptions>,
  "user_identifier" | "timeout" | "adapter"
> &
  Pick<Required<ModelConfig>, "modelId" | "modelProvider"> &
  RequestPrompt

export type RequestMetadata = Pick<ModelOptions, "user_identifier">

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
  public options: Required<ModelOptions>

  constructor(config: ModelConfig, opts: ModelOptions = {}) {
    // Defaults
    this.config = this.addDefaults(config)
    this.options = {
      timeout: 25000,
      user_identifier: null,
      frequency_penalty: 0,
      presence_penalty: 0,
      temperature: 0, // OpenAI defaults to 1
      top_p: 1, // OpenAI default, rec. not change unless temperature = 1
      stop_sequences: null, // OpenAI default
      max_tokens: 16, // OpenAI default
      stream: false,
      adapter: undefined,
      ...opts
    }
    // Create API client
    this.api = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `${this.config.authPrefix}${config.apiKey}`,
        ...this.config.customHeaders
      },
      adapter: this.options.adapter
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
      streamPath: config.generationPath,
      quality: "max",
      authPrefix: "Bearer ",
      retries: 3,
      debug: true,
      customHeaders: {},
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

  getRequestData(
    { prompt, suffix }: RequestPrompt,
    opts: Required<ModelOptions>
  ): RequestData {
    return {
      modelId: this.config.modelId,
      modelProvider: this.config.modelProvider,
      prompt,
      suffix,
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
    { prompt, suffix }: RequestPrompt,
    requestOpts: ModelOptions = {}
  ): Promise<string> {
    const opts: Required<ModelOptions> = {
      ...this.options,
      ...requestOpts
    }
    const request = this.getRequestData({ prompt, suffix }, opts)
    const id = objectHash(request)
    const promptSnippet = prompt.slice(0, 100)
    const cached = await this.config.cacheGet(id)
    if (cached) {
      this.log(`\nCACHE HIT for id ${id}: ${promptSnippet}...`)
      return cached
    }
    const payload = this.config.transformForRequest(request, opts)
    this.log(`COMPLETING id ${id}: ${promptSnippet}...`, {
      suffix: payload["suffix"],
      max_tokens: payload["max_tokens"],
      stop_sequences: payload["stop_sequences"]
    })
    let responseData: Record<string, any>
    try {
      const response = await this.api.post(
        this.config.generationPath,
        payload,
        { timeout: opts.timeout }
      )
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
    const result = this.config.transformResponse(responseData)
    if (!result) {
      const e = new Error(
        `Returned an empty result: ${JSON.stringify(responseData)}`
      )
      this.error(e)
      throw e
    }

    await this.config.cacheSet({
      id,
      prompt: request,
      completion: result
    })
    this.log("SAVED TO CACHE: " + id)
    return result
  }

  async stream(
    { prompt, suffix }: RequestPrompt,
    requestOpts: ModelOptions = {}
  ): Promise<Readable | ReadableStream> {
    const opts: Required<ModelOptions> = {
      ...this.options,
      ...requestOpts,
      stream: true
    }
    const { transformResponse, transformForRequest, streamPath } = this.config
    const request = this.getRequestData({ prompt, suffix }, opts)
    const id = objectHash(request)
    const promptSnippet = prompt.slice(0, 100)
    const payload = transformForRequest(request, opts)
    this.log(`STREAMING id ${id}: ${promptSnippet}...`, {
      suffix: payload["suffix"],
      max_tokens: payload["max_tokens"],
      stop_sequences: payload["stop_sequences"],
      stream: payload["stream"]
    })

    let stream: Readable | ReadableStream
    try {
      // TODO consolidate these all on client side
      if (IS_SERVER) {
        const response = await this.api.post<Readable>(streamPath, payload, {
          timeout: opts.timeout,
          responseType: "stream"
        })
        // Transform all data chunks using transformResponse
        stream = response.data.pipe(
          new Transform({
            transform: (chunk, encoding, callback: TransformCallback) => {
              const chunkStr: string = chunk.toString("utf8")
              for (const chunkDataRes of parseDataChunks(chunkStr)) {
                if (chunkDataRes === "[DONE]") {
                  this.log("End:", chunkDataRes)
                  callback(null, null)
                } else if (!chunkDataRes) {
                  const e = new Error(`Returned no data: ${chunkStr}`)
                  this.error(e)
                  callback(e, null)
                } else {
                  const chunkData = JSON.parse(chunkDataRes)
                  const result = transformResponse(chunkData)
                  if (!result) {
                    const e = new Error(`Returned empty data: ${chunkDataRes}`)
                    this.error(e)
                    callback(e, null)
                  } else {
                    this.log("Result: ", result)
                    callback(null, result)
                  }
                }
              }
            }
          })
        )
      } else {
        const response = await this.api.post<ReadableStream>(
          streamPath,
          payload,
          {
            timeout: opts.timeout,
            responseType: "stream"
          }
        )

        const transformStream = new TransformStream({
          transform: (chunk, controller) => {
            const chunkStr = new TextDecoder().decode(chunk)
            for (const chunkDataRes of parseDataChunks(chunkStr)) {
              if (chunkDataRes === "[DONE]") {
                this.log("End:", chunkDataRes)
                controller.terminate()
              } else if (!chunkDataRes) {
                const e = new Error(`Returned no data: ${chunkStr}`)
                this.error(e)
                controller.error(e)
              } else {
                const chunkData = JSON.parse(chunkDataRes)
                const result = transformResponse(chunkData)
                if (!result) {
                  const e = new Error(`Returned empty data: ${chunkDataRes}`)
                  this.error(e)
                  controller.error(e)
                } else {
                  this.log("Result: ", result)
                  controller.enqueue(result)
                }
              }
            }
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
}
