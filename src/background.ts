import * as apiExternal from "~core/api"
import * as apiLocal from "~core/api-local"
import {
  CompletionRequest,
  ErrorCode,
  PortName,
  PortRequest,
  RequestId
} from "~core/constants"
import { transactionManager } from "~core/managers/transaction"
import { log } from "~core/utils"
import { Extension, type Port } from "~platforms/extension"

const NOTIFICATION_HEIGHT = 600
const NOTIFICATION_WIDTH = 320

export {}

log("Background script loaded")

Extension.addPortListener(PortName.Window, handleWindowRequest)

async function handleWindowRequest(
  event: PortRequest[PortName.Window],
  port: Port
) {
  log("Background received message: ", event, port)

  const { id, request } = event

  const permit = await requestPermission(request)
  if (permit.error) {
    port.postMessage({ ...permit, id })
    return
  }

  const txn = request.transaction
  // Save the incomplete txn
  await transactionManager.save(txn)

  const api = isLocalhost(request) ? apiLocal : apiExternal

  if (request.shouldStream) {
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

async function requestPermission(request: CompletionRequest) {
  const window = await Extension.openPopup(
    NOTIFICATION_WIDTH,
    NOTIFICATION_HEIGHT
  )
  const permissionResult = await Extension.sendMessage(
    { request },
    PortName.Permission,
    window.tabs[0].id
  )

  return permissionResult
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
