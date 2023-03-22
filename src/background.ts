import browser, { type Runtime } from "webextension-polyfill"

import { post, stream } from "~core/api"
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

  const completionReq = request as CompletionRequest

  if (completionReq.shouldStream) {
    const results = await stream<StreamResponse>("/api/model/stream", {
      prompt: completionReq.prompt
    })

    for await (const result of results) {
      console.info("Got result: ", result)
      port.postMessage({ ...result, id })
    }
  } else {
    const result = await post<CompletionResponse>("/api/model/complete", {
      prompt: request.prompt
    })

    port.postMessage({ ...result, id })
  }
}
