import browser, { type Runtime } from "webextension-polyfill"

import * as apiExternal from "~core/api"
import * as apiLocal from "~core/api-local"
import type {
  CompletionRequest,
  CompletionResponse,
  StreamResponse
} from "~core/constants"
import { log } from "~core/utils"

export {}

log("Background script loaded")
browser.runtime.onConnect.addListener((port: Runtime.Port) => {
  log("Background received connection: ", port)

  port.onMessage.addListener(handleRequest)
})

async function handleRequest(event: any, port: Runtime.Port) {
  log("Background received message: ", event, port)

  const { id, request } = event

  const req = request as CompletionRequest

  const api = isLocalhost(req) ? apiLocal : apiExternal

  if (req.shouldStream) {
    const results = await api.stream<StreamResponse>("/api/model/stream", {
      prompt: req.prompt
    })

    for await (const result of results) {
      console.info("Got result: ", result)
      port.postMessage({ ...result, id })
    }
  } else {
    const result = await api.post<CompletionResponse>("/api/model/complete", {
      prompt: req.prompt
    })

    port.postMessage({ ...result, id })
  }
}

function isLocalhost(req: CompletionRequest): boolean {
  // TODO check url etc instead, after API consolidated
  // if (!url) {
  //   return false
  // }
  // const parsed = new URL(url)
  // return parsed.hostname === "localhost" || parsed.hostname.startsWith("127.")
  return !!req.isLocal
}
