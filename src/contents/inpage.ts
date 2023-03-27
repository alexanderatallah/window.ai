import type { PlasmoCSConfig } from "plasmo"
import { v4 as uuidv4 } from "uuid"

import {
  CompletionRequest,
  CompletionResponse,
  ContentMessageType,
  PORT_NAME,
  RequestId,
  StreamResponse
} from "~core/constants"
import { Origin, originManager } from "~core/managers/origin"
import { transactionManager } from "~core/managers/transaction"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  all_frames: true
  // run_at: "document_start" // This causes some Next.js pages (e.g. Plasmo docs) to break
}

export const Web41 = {
  _isLocal: false,

  async getCompletion(prompt: string): Promise<string> {
    const requestId = _relayRequest<CompletionRequest>({
      transaction: transactionManager.init(prompt, Web41.origin()),
      isLocal: Web41._isLocal
    })
    return new Promise((resolve, reject) => {
      _onRelayResponse<CompletionResponse>(requestId, (res) => {
        if ("error" in res) {
          reject(res.error)
        } else if ("text" in res) {
          resolve(res.text)
        } else {
          reject(
            new Error(
              `Unexpected response: no text found in ${JSON.stringify(res)}`
            )
          )
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
  },

  async streamCompletion(prompt: string): Promise<RequestId> {
    const requestId = _relayRequest<CompletionRequest>({
      transaction: transactionManager.init(prompt, Web41.origin()),
      shouldStream: true,
      isLocal: Web41._isLocal
    })
    return new Promise((resolve, reject) => {
      _onRelayResponse<CompletionResponse>(requestId, (res) => {
        if ("error" in res) {
          reject(res.error)
        } else if ("nextRequestId" in res) {
          resolve(res.nextRequestId)
        } else {
          reject(
            new Error(
              `Unexpected response: no request ID found in ${JSON.stringify(
                res
              )}`
            )
          )
        }
      })
    })
  },

  addListener(requestId: string, handler: (res: string) => unknown) {
    _onRelayResponse<StreamResponse>(requestId, (res) => handler(res.text))
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
      portName: PORT_NAME,
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

function _onRelayResponse<T>(
  requestId: RequestId,
  handler: (data: T) => unknown
) {
  window.addEventListener(
    "message",
    (event) => {
      const { source, data } = event

      // We only accept messages our window and port
      if (source !== window || data?.portName !== PORT_NAME) {
        return
      }

      if (data?.type === ContentMessageType.Response && data.id === requestId) {
        // log("Inject script received response: ", data);
        handler(data.response)
      }
    },
    false
  )
}

declare global {
  interface Window {
    ai: typeof Web41
  }
}
window.ai = Web41
