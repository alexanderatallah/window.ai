import axiosRetry, { exponentialDelay } from 'axios-retry'
import axios, { AxiosInstance } from 'axios'
import objectHash from 'object-hash'
import type { EventEmitter } from 'events'

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
  quality?: 'low' | 'max' // defaults to 'max'
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

export type RequestData = Omit<ModelOptions, 'user_identifier' | 'timeout'> &
  Pick<ModelConfig, 'modelId' | 'modelProvider'> &
  RequestPrompt

export type RequestMetadata = Pick<ModelOptions, 'user_identifier'>

// TODO cache statistics and log probs etc
export type CacheGetter = (id: string) => Promise<string | null | undefined>

export type CacheSetter = (data: {
  id: string
  prompt: RequestData
  completion: string
}) => Promise<unknown>

export enum StreamEvent {
  Data = 'data',
  Error = 'error',
  End = 'end'
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
      max_tokens: 256,
      stream: false,
      ...opts,
    }
    // Create API client
    this.api = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${this.config.authPrefix}${config.apiKey}`,
        ...this.config.customHeaders,
      },
    })
    axiosRetry(this.api, {
      retries: this.config.retries,
      retryDelay: exponentialDelay,
    })
  }

  get identifier(): string {
    return `${this.config.modelProvider}.${this.config.modelId}`
  }

  addDefaults(config: ModelConfig): Required<ModelConfig> {
    return {
      quality: 'max',
      authPrefix: 'Bearer ',
      retries: 3,
      tokenLimit: 4000,
      debug: true,
      customHeaders: {},
      ...config,
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
    }
  }

  async generate(
    { prompt, suffix }: RequestPrompt,
    requestOpts: ModelOptions = {}
  ): Promise<string> {
    const opts: Required<ModelOptions> = {
      ...this.options,
      ...requestOpts,
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
      suffix: payload['suffix'],
      max_tokens: payload['max_tokens'],
      stop_sequences: payload['stop_sequences'],
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

    this.log('RESPONSE for id ' + id)
    const result = this.config.transformResponse(responseData)
    if (!result) {
      const e = new Error(`Returned an empty result: ${JSON.stringify(responseData)}`)
      this.error(e)
      throw e
    }

    await this.config.cacheSet({
      id,
      prompt: request,
      completion: result,
    })
    this.log('SAVED TO CACHE: ' + id)
    return result
  }

  async stream(
    { prompt, suffix }: RequestPrompt,
    requestOpts: ModelOptions = {}
  ): Promise<EventEmitter> {
    const opts: Required<ModelOptions> = {
      ...this.options,
      ...requestOpts,
      stream: true,
    }
    const request = this.getRequestData({ prompt, suffix }, opts)
    const id = objectHash(request)
    const promptSnippet = prompt.slice(80, 300)
    const payload = this.config.transformForRequest(request, opts)
    this.log(`STREAMING id ${id}: ...${promptSnippet}...`, {
      suffix: payload['suffix'],
      max_tokens: payload['max_tokens'],
      stop_sequences: payload['stop_sequences'],
    })

    try {
      const response = await this.api.post<EventEmitter>(
        this.config.generationPath,
        payload,
        { timeout: opts.timeout, responseType: 'stream' }
      )

      return response.data

      // .on('data', (chunk) => {
      //   const chunkStr = chunk.toString('utf8');
      //   const chunkDataRes = chunkStr.split('data: ')[1];
      //   if (chunkDataRes === '[DONE]') {
      //     // res.write('event: done\ndata: {"message": "Stream finished"}\n\n');
      //     // res.end();
      //     emitter.emit(StreamEvent.Done, { message: 'Stream finished' });
      //   } else {
      //     // res.write(`data: ${chunkStr}\n\n`);
      //     const chunkData = JSON.parse(chunkDataRes)
      //     const result = this.config.transformResponse(chunkData)
      //     emitter.emit(StreamEvent.Data, result);
      //   }
      // });

      // // Listen for error events
      // response.data.on('error', (err) => {
      //   emitter.emit(StreamEvent.Error, err);
      // });

      // // Listen for end events
      // response.data.on('end', () => {
      //   emitter.emit(StreamEvent.Done);
      // });

      // return emitter;
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
