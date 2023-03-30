import type { PlasmoCSConfig } from "plasmo"
import { v4 as uuidv4 } from "uuid"

import {
  CompletionRequest,
  CompletionResponse,
  ContentMessageType,
  PortName,
  RequestId,
  StreamResponse
} from "~core/constants"
import { Origin, originManager } from "~core/managers/origin"
import { transactionManager } from "~core/managers/transaction"
import { Result, isOk } from "~core/utils/result-monad"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  all_frames: true
  // run_at: "document_start" // This causes some Next.js pages (e.g. Plasmo docs) to break
}

export const Web41 = {
  async getCompletion(prompt: string): Promise<string> {
    const requestId = _relayRequest<CompletionRequest>({
      transaction: transactionManager.init(prompt, Web41.origin())
    })
    return new Promise((resolve, reject) => {
      _addRequestListener<CompletionResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve(res.data)
        } else {
          reject(res.error)
        }
      })
    })
  },

  async streamCompletion(
    prompt: string,
    handler: (result: string | null, error: string | null) => unknown
  ): Promise<RequestId> {
    const requestId = _relayRequest<CompletionRequest>({
      transaction: transactionManager.init(prompt, Web41.origin()),
      shouldStream: true
    })
    return new Promise((resolve, reject) => {
      _addRequestListener<StreamResponse>(requestId, (res) => {
        if (isOk(res)) {
          resolve(requestId)
          handler(res.data, null)
        } else {
          reject(res.error)
          handler(null, res.error)
        }
      })
    })
  },

  origin(): Origin {
    return originManager.init(
      window.location.origin,
      window.location.pathname,
      window.document.title
    )
  }

  // TODO: Implement cancel
  // cancel(requestId: string) {
  //   _cancel(requestId)
  // }
}

function _relayRequest<T>(request: T): RequestId {
  const requestId = uuidv4() as RequestId
  window.postMessage(
    {
      type: ContentMessageType.Request,
      id: requestId,
      portName: PortName.Window,
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

    // We only accept messages our window and port
    if (source !== window || data?.portName !== PortName.Window) {
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

declare global {
  interface Window {
    ai: typeof Web41
  }
}
window.ai = Web41
