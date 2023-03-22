import browser, { type Runtime } from "webextension-polyfill"

import type {
  CompletionRequest,
  CompletionResponse,
  StreamResponse
} from "~core/constants"
import { postAPI, streamAPI } from "~core/network"
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
    const stream = await streamAPI<StreamResponse>("/api/model/stream", {
      prompt: completionReq.prompt
    })

    for await (const result of stream) {
      console.info("Got result: ", result)
      port.postMessage({ ...result, id })
    }
  } else {
    const result = await postAPI<CompletionResponse>("/api/model/complete", {
      prompt: request.prompt
    })

    port.postMessage({ ...result, id })
  }
}
