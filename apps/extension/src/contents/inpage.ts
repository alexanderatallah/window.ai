import type { PlasmoCSConfig } from "plasmo"
import { v4 as uuidv4 } from "uuid"
import {
  type AIModelAvailability,
  type AIPolyfill,
  type AITextModelInfo,
  type AITextSession,
  type AITextSessionOptions,
  type ChatMessage,
  type CompletionOptions,
  type EventListenerHandler,
  EventType,
  type Input,
  type MessageOutput,
  type ModelID,
  type RequestID,
  type TextOutput,
  VALID_DOMAIN,
  type WindowAI
} from "window.ai"

import type {
  CompletionResponse,
  EventResponse,
  MediaResponse,
  ModelResponse,
  PortRequest
} from "~core/constants"
import { ContentMessageType, PortName } from "~core/constants"
import type { OriginData } from "~core/managers/origin"
import { originManager } from "~core/managers/origin"
import { transactionManager } from "~core/managers/transaction"
import type { Result } from "~core/utils/result-monad"
import { isOk } from "~core/utils/result-monad"

import { version } from "../../package.json"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  all_frames: true
  // run_at: "document_start" // This causes some Next.js pages (e.g. Plasmo docs) to break
}

export const nativeWindowAIPolyfill: AIPolyfill = {
  async canCreateTextSession(): Promise<AIModelAvailability> {
    // Placeholder: Check if the model is available
    // add options to make sure at least one local llm or external api key is present
    const isModelAvailable = await checkModelAvailability()
    if (!isModelAvailable) {
      return "no"
    }
    const isModelDownloaded = await checkModelDownloaded()
    return isModelDownloaded ? "readily" : "after-download"
  },

  async createTextSession(
    options: AITextSessionOptions = {}
  ): Promise<AITextSession> {
    const availability = await this.canCreateTextSession()
    if (availability === "no") {
      throw new DOMException(
        "Language model is not supported",
        "NotSupportedError"
      )
    }

    if (availability === "after-download") {
      await downloadModel()
    }

    return createTextSessionImpl(options)
  },

  ontextmodeldownloadprogress: null,

  async textModelInfo(): Promise<AITextModelInfo> {
    // Placeholder: Return model info
    return getModelInfo()
  }
}

class AITextSessionImpl implements AITextSession {
  private options: CompletionOptions<string, Input> & AITextSessionOptions

  constructor(options: AITextSessionOptions) {
    this.options = {
      maxTokens: undefined, // unlikely the native webAI will implement this
      model: undefined, // hard code this for example. Ideally This would be handled by the extension popup
      stopSequences: undefined, // this is a great feature but likely won't make it in the API
      numOutputs: undefined, //the web AI api provides a session clone which essentially replaces this feature
      onStreamResult: undefined, // the web AI api exposes two separate functions for steaming and async
      temperature: 0.7, // This is and the rest are specified by the current window.ai spec https://github.com/explainers-by-googlers/prompt-api#downloading-and-session-creation-flow
      systemPrompt: options.systemPrompt,
      initialPrompts: options.initialPrompts
    }
  }

  async prompt(input: string): Promise<string> {
    // Likely need to do some input validation here
    return generateResponse(input, this.options)
  }

  promptStreaming(input: string): ReadableStream {
    // Likely need to do some input validation here
    return generateStreamingResponse(input, this.options)
  }

  get topK(): number {
    return this.options.topK ?? 0 // Default value, adjust as needed
  }

  get temperature(): number {
    return this.options.temperature ?? 0 // Default value, adjust as needed
  }

  async clone(): Promise<AITextSession> {
    return new AITextSessionImpl({ ...this.options })
  }

  destroy(): void {
    // Placeholder: Clean up resources
    // TODO: store sessions in a weak map so they're garbage collected properly
    cleanUpSession(this)
  }
}

// Placeholder functions for model interactions
async function checkModelAvailability(): Promise<boolean> {
  // Implementation to check if the model is available
  return true
}

async function checkModelDownloaded(): Promise<boolean> {
  // Implementation to check if the model is downloaded
  return false
}

async function downloadModel(): Promise<void> {
  // Implementation to download the model
  // This should trigger progress events
  const totalSize = 1000000 // Example total size
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate download time
    const progressEvent = new ProgressEvent("textmodeldownloadprogress", {
      lengthComputable: true,
      loaded: (i + 1) * (totalSize / 10),
      total: totalSize
    })
    if (nativeWindowAIPolyfill.ontextmodeldownloadprogress) {
      nativeWindowAIPolyfill.ontextmodeldownloadprogress(progressEvent)
    }
  }
}

function createTextSessionImpl(options: AITextSessionOptions): AITextSession {
  return new AITextSessionImpl(options)
}

// I'm assuming this will be editable in the final api release
async function getModelInfo(): Promise<AITextModelInfo> {
  return {
    defaultTopK: 40,
    maxTopK: 100,
    defaultTemperature: 0.7
  }
}

async function generateResponse(
  input: string,
  options: AITextSessionOptions
): Promise<string> {
  try {
    const response = await windowAI.generateText<Input>(
      {
        messages: options.initialPrompts,
        prompt: input
      },
      options
    )
    console.log({ response })
    return response.at(-1)?.message?.content
  } catch (error) {
    console.error("Error generating response:", error)
    return "FAILED TO GENERATE RESPONSE"
  }
}

function generateStreamingResponse(
  input: string,
  options: AITextSessionOptions
): ReadableStream<Uint8Array> & AsyncIterable<string> {
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      try {
        const requestId = _relayRequest(PortName.Completion, {
          transaction: transactionManager.init<Input>(
            {
              messages: options.initialPrompts,
              prompt: input
            },
            _getOriginData(),
            options
          ),
          hasStreamHandler: true
        })

        _addResponseListener<CompletionResponse<Input>>(requestId, (res) => {
          if (isOk(res)) {
            if (res.data) {
              res.data.forEach((d) => {
                // @ts-ignore
                if (d.isPartial)
                  controller.enqueue(
                    new TextEncoder().encode(d.message.content)
                  )
                else controller.close()
              })
            }
          } else {
            controller.error(res.error)
          }
        })
      } catch (error) {
        controller.error(error)
      }
    },
    cancel: () => {
      // TODO: cancel Stream
    }
  })

  ;(stream as any)[Symbol.asyncIterator] = async function* () {
    reader = stream.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        yield new TextDecoder().decode(value)
      }
    } finally {
      reader.releaseLock()
    }
  }

  return stream as ReadableStream<Uint8Array> & AsyncIterable<string>
}

function cleanUpSession(session: AITextSessionImpl): void {
  // Implementation to clean up resources
}

export const windowAI: WindowAI<ModelID | string> = {
  __window_ai_metadata__: {
    domain: VALID_DOMAIN,
    version
  },

  async generateText(input, options = {}) {
    const { onStreamResult } = _validateOptions(options)
    const hasStreamHandler = !!onStreamResult
    const requestId = _relayRequest(PortName.Completion, {
      transaction: transactionManager.init(input, _getOriginData(), options),
      hasStreamHandler
    })
    return new Promise((resolve, reject) => {
      _addResponseListener<CompletionResponse<typeof input>>(
        requestId,
        (res) => {
          if (isOk(res)) {
            if (
              res.data[0] &&
              "isPartial" in res.data[0] &&
              res.data[0].isPartial
            ) {
              onStreamResult && res.data.forEach((d) => onStreamResult(d, null))
            } else {
              resolve(res.data)
            }
          } else {
            reject(res.error)
            onStreamResult && onStreamResult(null, res.error)
          }
        }
      )
    })
  },

  async BETA_generate3DObject(input, options = {}) {
    const requestId = _relayRequest(PortName.Media, {
      transaction: transactionManager.init(input, _getOriginData(), options)
    })
    return new Promise((resolve, reject) => {
      _addResponseListener<MediaResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve(res.data)
        } else {
          reject(res.error)
        }
      })
    })
  },

  async getCompletion(input, options = {}) {
    const shouldReturnMultiple = options.numOutputs && options.numOutputs > 1
    return windowAI.generateText(input, options).then((res) => {
      return shouldReturnMultiple ? res : (res[0] as any)
    })
  },

  async getCurrentModel() {
    const requestId = _relayRequest(PortName.Model, undefined)
    return new Promise((resolve, reject) => {
      _addResponseListener<ModelResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve(res.data.model)
        } else {
          reject(res.error)
        }
      })
    })
  },

  addEventListener<T>(handler: EventListenerHandler<T>) {
    // TODO - use a dedicated port for events
    const requestId = _relayRequest(PortName.Events, {
      shouldListen: true
    })
    _addResponseListener<EventResponse<T>>(null, (res) => {
      if (isOk(res)) {
        if (res.data.event) {
          handler(res.data.event, res.data.data)
        }
      } else {
        handler(EventType.Error, res.error)
      }
    })
    return requestId
  },

  BETA_updateModelProvider({ baseUrl, session, shouldSetDefault }) {
    const requestId = _relayRequest(PortName.Model, {
      baseUrl,
      session,
      shouldSetDefault
    })
    return new Promise((resolve, reject) => {
      _addResponseListener<ModelResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve()
        } else {
          reject(res.error)
        }
      })
    })
  }
}

// TODO better validation
function _validateOptions<TOptions>(options: TOptions): TOptions {
  console.log({ options })
  if (
    typeof options !== "object" ||
    (!!options &&
      "onStreamResult" in options &&
      options.onStreamResult &&
      typeof options.onStreamResult !== "function")
  ) {
    throw new Error("Invalid options")
  }
  return options
}

function _getOriginData(): OriginData {
  return originManager.getData(
    window.location.origin,
    window.location.pathname,
    window.document.title
  )
}

function _relayRequest<PN extends PortName>(
  portName: PN,
  request: PortRequest[PN]["request"]
): RequestID {
  const requestId = uuidv4() as RequestID
  const msg = {
    type: ContentMessageType.Request,
    portName,
    id: requestId,
    request
  }
  window.postMessage(msg, "*")
  return requestId
}

// TODO figure out how to reclaim memory
// `null` means all listen for all requests
const _responseListeners = new Map<RequestID | null, Set<(data: any) => void>>()

function _addResponseListener<T extends Result<any, string>>(
  requestId: RequestID | null,
  handler: (data: T) => void
) {
  const handlerSet =
    _responseListeners.get(requestId) || new Set<(data: T) => void>()
  handlerSet.add(handler)
  _responseListeners.set(requestId, handlerSet)
}

window.addEventListener(
  "message",
  (event) => {
    const { source, data } = event

    // We only accept messages our window and a port
    if (source !== window || !data.portName) {
      return
    }
    if (data.type === ContentMessageType.Response) {
      const msg = data as { id: RequestID; response: unknown }
      const handlers = new Set([
        ...(_responseListeners.get(msg.id) || []),
        ...(_responseListeners.get(null) || [])
      ])

      if (handlers.size === 0) {
        throw new Error(`No handlers found for request ${msg.id}`)
      }
      handlers.forEach((h) => h(msg.response))
    }
  },
  false
)

window.ai = nativeWindowAIPolyfill as AIPolyfill
