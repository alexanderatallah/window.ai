import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import * as apiExternal from "~core/api"
import * as apiLocal from "~core/api-local"
import type {
  CompletionRequest,
  PortName,
  PortRequest,
  PortResponse
} from "~core/constants"
import { transactionManager } from "~core/managers/transaction"
import { log } from "~core/utils"

import { requestPermission } from "./permission"

const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Window],
  PortResponse[PortName.Window]
> = async (req, res) => {
  log("Background received message: ", req)

  const { id, request } = req.body

  const permit = await requestPermission(request, id)
  if ("error" in permit) {
    res.send({ response: permit, id })
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
      res.send({ response: result, id })
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

    res.send({ response: result, id })
    if ("text" in result) {
      txn.completion = result.text
    } else {
      txn.error = result.error
    }
  }

  // Update the completion with the reply
  await transactionManager.save(txn)
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

export default handler
