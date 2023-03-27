import * as apiExternal from "~core/api"
import * as apiLocal from "~core/api-local"
import { CompletionRequest, ErrorCode, RequestId } from "~core/constants"
import { transactionManager } from "~core/managers/transaction"
import { Extension, type Port } from "~core/platforms/extension"
import { log } from "~core/utils"

export {}

log("Background script loaded")
Extension.addPortListener((port: Port) => {
  log("Background received connection: ", port)

  port.onMessage.addListener(handleRequest)
})

async function handleRequest(event: any, port: Port) {
  log("Background received message: ", event, port)

  const { id, request } = event
  const req = request as CompletionRequest

  const permitted = await requestPermission(req, port, id)
  if (!permitted) {
    return
  }

  const txn = req.transaction
  // Save the incomplete txn
  await transactionManager.save(txn)

  const api = isLocalhost(req) ? apiLocal : apiExternal

  if (req.shouldStream) {
    const replies = []
    const errors = []

    const results = await api.stream("/api/model/stream", {
      prompt: txn.prompt
    })

    for await (const result of results) {
      console.info("Got result: ", result)
      port.postMessage({ ...result, id })
      if ("text" in result) {
        replies.push(result.text)
      } else {
        errors.push(result.error)
      }
    }

    txn.completion = replies.join("") || undefined
    txn.error = errors.join("") || undefined
  } else {
    const result = await api.post("/api/model/complete", {
      prompt: txn.prompt
    })

    port.postMessage({ ...result, id })
    if ("text" in result) {
      txn.completion = result.text
    } else {
      txn.error = result.error
    }
  }

  // Update the completion with the reply
  await transactionManager.save(txn)
}

async function requestPermission(
  req: CompletionRequest,
  port: Port,
  id: RequestId
): Promise<boolean> {
  const result = { error: ErrorCode.PermissionDenied }
  port.postMessage({ ...result, id })
  return false
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
