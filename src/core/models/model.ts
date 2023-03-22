import axios, { AxiosInstance } from "axios"
import axiosRetry, { exponentialDelay } from "axios-retry"
import objectHash from "object-hash"
import { Readable, Transform, TransformCallback } from "stream"

import { parseDataChunks } from "~core/utils"

export interface ModelConfig {
  baseUrl: string
  generationPath: string
  apiKey: string
  modelProvider: string
  modelId: string
  customHeaders?: Record<string, string>
  tokenLimit?: number
  authPrefix?: string
  debug?: boolean
  retries?: number
  quality?: "low" | "max" // defaults to 'max'
  cacheGet: CacheGetter
  cacheSet: CacheSetter
  transformForRequest: (
    prompt: RequestData,
    meta: RequestMetadata
  ) => Record<string, unknown>
  transformResponse: (res: Record<string, any>) => string
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
}

export type RequestPrompt = { prompt: string; suffix?: string }

export type RequestData = Omit<
  Required<ModelOptions>,
  "user_identifier" | "timeout"
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

export enum StreamEvent {
  Data = "data",
  Error = "error",
  End = "end"
}

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
      temperature: 0,
      frequency_penalty: 0,
      presence_penalty: 0,
      top_p: 1,
      stop_sequences: null,
      max_tokens: 30,
      stream: false,
      ...opts
    }
    // Create API client
    this.api = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `${this.config.authPrefix}${config.apiKey}`,
        ...this.config.customHeaders
      }
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
    return {
      quality: "max",
      authPrefix: "Bearer ",
      retries: 3,
      tokenLimit: 4000,
      debug: true,
      customHeaders: {},
      ...config
    }
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

  async generate(
    { prompt, suffix }: RequestPrompt,
    requestOpts: ModelOptions = {}
  ): Promise<string> {
    const opts: Required<ModelOptions> = {
      ...this.options,
      ...requestOpts
    }
    const request = this.getRequestData({ prompt, suffix }, opts)
    const id = objectHash(request)
    const promptSnippet = prompt.slice(80, 300)
    const cached = await this.config.cacheGet(id)
    if (cached) {
      this.log(`\nCACHE HIT for id ${id}: ...${promptSnippet}...`)
      return cached
    }
    const payload = this.config.transformForRequest(request, opts)
    this.log(`FETCHING id ${id}: ...${promptSnippet}...`, {
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
  ): Promise<Readable> {
    const opts: Required<ModelOptions> = {
      ...this.options,
      ...requestOpts,
      stream: true
    }
    const { transformResponse, transformForRequest, generationPath } =
      this.config
    const request = this.getRequestData({ prompt, suffix }, opts)
    const id = objectHash(request)
    const promptSnippet = prompt.slice(80, 300)
    const payload = transformForRequest(request, opts)
    this.log(`STREAMING id ${id}: ...${promptSnippet}...`, {
      stream: payload["stream"]
    })

    try {
      const response = await this.api.post<Readable>(generationPath, payload, {
        timeout: opts.timeout,
        responseType: "stream"
      })

      // Transform all data chunks using transformResponse
      const stream = response.data.pipe(
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

      return stream
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
  }
}
