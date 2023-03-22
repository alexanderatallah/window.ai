import type { PlasmoCSConfig } from "plasmo"
import { v4 as uuidv4 } from "uuid"

import {
  CompletionRequest,
  CompletionResponse,
  ContentMessageType,
  PORT_NAME,
  StreamResponse
} from "~core/constants"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  all_frames: true
  // run_at: "document_start" // This causes some Next.js pages (e.g. Plasmo docs) to break
}

export const Web41 = {
  async getCompletion(prompt: string): Promise<string> {
    const requestId = _relayRequest<CompletionRequest>({ prompt })
    return new Promise((resolve) => {
      _onRelayResponse<CompletionResponse>(requestId, (res) =>
        resolve(res.completion)
      )
    })
  },

  streamCompletion(prompt: string): string {
    return _relayRequest<CompletionRequest>({ prompt, shouldStream: true })
  },

  addListener(requestId: string, handler: (res: string) => unknown) {
    _onRelayResponse<StreamResponse>(requestId, (res) => handler(res.text))
  },

  cancel(requestId: string) {
    _cancel(requestId)
  }
}

function _relayRequest<T>(request: T): string {
  const requestId = uuidv4()
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

function _cancel(requestId: string) {
  window.postMessage(
    {
      type: ContentMessageType.Cancel,
      id: requestId,
      portName: PORT_NAME
    },
    "*"
  )
}

function _onRelayResponse<T>(requestId: string, handler: (data: T) => unknown) {
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
