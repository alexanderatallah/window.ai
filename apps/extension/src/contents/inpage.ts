import type { PlasmoCSConfig } from "plasmo"
import { v4 as uuidv4 } from "uuid"

import type {
  CompletionResponse,
  EventResponse,
  ModelResponse,
  PortRequest,
  RequestId
} from "~core/constants"
import { ContentMessageType, PortName } from "~core/constants"
import type { OriginData } from "~core/managers/origin"
import { originManager } from "~core/managers/origin"
import { transactionManager } from "~core/managers/transaction"
import type { Result } from "~core/utils/result-monad"
import { isOk } from "~core/utils/result-monad"
import type { CompletionOptions, Input, Output } from "~public-interface"
import { ErrorCode, EventType, ModelID } from "~public-interface"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  all_frames: true
  // run_at: "document_start" // This causes some Next.js pages (e.g. Plasmo docs) to break
}

export const WindowAI = {
  async getCompletion(
    input: Input,
    options: CompletionOptions = {}
  ): Promise<Output | Output[]> {
    const { onStreamResult } = _validateOptions(options)
    const shouldStream = !!onStreamResult
    const shouldReturnMultiple = options.numOutputs && options.numOutputs > 1
    const requestId = _relayRequest(PortName.Completion, {
      transaction: transactionManager.init(input, _getOriginData(), options),
      shouldStream
    })
    return new Promise((resolve, reject) => {
      _addResponseListener<CompletionResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve(shouldReturnMultiple ? res.data : res.data[0])
          onStreamResult && onStreamResult(res.data[0], null)
        } else {
          reject(res.error)
          onStreamResult && onStreamResult(null, res.error)
        }
      })
    })
  },

  async getCurrentModel(): Promise<ModelID> {
    const requestId = _relayRequest(PortName.Model, {})
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

  addEventListener<T>(
    handler: (event: EventType, data: T | ErrorCode) => void
  ): RequestId {
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
  }
}

// TODO better validation
function _validateOptions(options: CompletionOptions): CompletionOptions {
  if (
    typeof options !== "object" ||
    (options.onStreamResult && typeof options.onStreamResult !== "function")
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
): RequestId {
  const requestId = uuidv4() as RequestId
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
const _responseListeners = new Map<RequestId | null, Set<(data: any) => void>>()

function _addResponseListener<T extends Result<any, string>>(
  requestId: RequestId | null,
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
      const msg = data as { id: RequestId; response: unknown }

      const handlers = new Set([
        ...(_responseListeners.get(msg.id) || []),
        ...(_responseListeners.get(null) || [])
      ])
      if (handlers.size === 0) {
        throw `No handlers found for request ${msg.id}`
      }
      handlers.forEach((h) => h(msg.response))
    }
  },
  false
)

window.ai = window.ai || WindowAI
