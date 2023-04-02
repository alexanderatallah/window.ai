import type { PlasmoCSConfig } from "plasmo"
import { v4 as uuidv4 } from "uuid"

import {
  CompletionRequest,
  CompletionResponse,
  ContentMessageType,
  ModelRequest,
  ModelResponse,
  PortName,
  RequestId
} from "~core/constants"
import { Origin, originManager } from "~core/managers/origin"
import { transactionManager } from "~core/managers/transaction"
import { Result, isOk } from "~core/utils/result-monad"
import type {
  CompletionOptions,
  Input,
  ModelID,
  Output
} from "~public-interface"

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
  ): Promise<Output> {
    const { onStreamResult } = _validateOptions(options)
    const shouldStream = !!onStreamResult
    const requestId = _relayRequest<CompletionRequest>(PortName.Completion, {
      transaction: transactionManager.init(input, _getPageOrigin(), options),
      shouldStream
    })
    return new Promise((resolve, reject) => {
      _addRequestListener<CompletionResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve(res.data)
          onStreamResult && onStreamResult(res.data, null)
        } else {
          reject(res.error)
          onStreamResult && onStreamResult(null, res.error)
        }
      })
    })
  },

  async getCurrentModel(): Promise<ModelID> {
    const requestId = _relayRequest<ModelRequest>(PortName.Model, {})
    return new Promise((resolve, reject) => {
      _addRequestListener<ModelResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve(res.data)
        } else {
          reject(res.error)
        }
      })
    })
  }
}

function _validateOptions(options: CompletionOptions): CompletionOptions {
  if (
    typeof options !== "object" ||
    (options.onStreamResult && typeof options.onStreamResult !== "function")
  ) {
    throw new Error("Invalid options")
  }
  return options
}

function _getPageOrigin(): Origin {
  return originManager.init(
    window.location.origin,
    window.location.pathname,
    window.document.title
  )
}

function _relayRequest<T>(portName: PortName, request: T): RequestId {
  const requestId = uuidv4() as RequestId
  window.postMessage(
    {
      type: ContentMessageType.Request,
      id: requestId,
      portName,
      request
    },
    "*"
  )
  return requestId
}

// function _cancel(requestId: RequestId) {
//   window.postMessage(
//     {
//       type: ContentMessageType.Cancel,
//       id: requestId,
//       portName: PORT_NAME
//     },
//     "*"
//   )
// }

// TODO figure out how to reclaim memory
const _requestListeners = new Map<RequestId, Set<(data: any) => void>>()

function _addRequestListener<T extends Result<any, string>>(
  requestId: RequestId,
  handler: (data: T) => void
) {
  const handlerSet =
    _requestListeners.get(requestId) || new Set<(data: T) => void>()
  handlerSet.add(handler)
  _requestListeners.set(requestId, handlerSet)
}

window.addEventListener(
  "message",
  (event) => {
    const { source, data } = event

    // We only accept messages our window and a port
    if (source !== window || !data.portName) {
      return
    }

    if (data?.type === ContentMessageType.Response) {
      const handlers = _requestListeners.get(data.id)
      if (!handlers) {
        throw `No handlers found for request ${data.id}`
      }
      handlers.forEach((h) => h(data.response))
    }
  },
  false
)

window.ai = WindowAI
