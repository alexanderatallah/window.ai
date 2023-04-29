import { ErrorCode, type Input, type Output, isMessagesInput } from "window.ai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import type { PortRequest, PortResponse } from "~core/constants"
import { PortName } from "~core/constants"
import { transactionManager } from "~core/managers/transaction"
import * as modelRouter from "~core/model-router"
import { err, isErr, isOk, ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"

import { requestPermission } from "./permission"

const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Completion],
  PortResponse[PortName.Completion]
> = async (req, res) => {
  log("Background received message: ", req)

  if (!req.body) {
    return res.send(err(ErrorCode.InvalidRequest))
  }

  const { id, request } = req.body

  const permit = await requestPermission(request, id)
  if (isErr(permit)) {
    return res.send({ response: permit, id })
  }

  const txn = request.transaction
  // Save the incomplete txn
  await transactionManager.save(txn)

  const hasMultipleOutputs = txn.numOutputs && txn.numOutputs > 1
  const replies: string[] = []
  const errors: string[] = []
  const results = await modelRouter.generate(txn)

  for await (const result of results) {
    if (isOk(result)) {
      const outputs = [getOutput(txn.input, result.data, true)]
      res.send({ response: ok(outputs), id })
      replies.push(result.data)
    } else {
      res.send({ response: result, id })
      errors.push(result.error)
      // TODO handle auth errors
      // if (isAuthError(result.error)) {
      //   await requestAuth()
      // }
    }
  }

  // Collect the replies and errors onto the txn
  txn.outputs = !replies.length
    ? undefined
    : hasMultipleOutputs
    ? replies.map((r) => getOutput(txn.input, r))
    : [getOutput(txn.input, replies.join(""))]
  txn.error = errors.join("\n") || undefined

  // Send the final output to the client, as non-partial
  if (txn.outputs) {
    res.send({ response: ok(txn.outputs), id })
  }

  // Update the completion with the reply
  await transactionManager.save(txn)
}

function getOutput(input: Input, result: string, isPartial?: boolean): Output {
  return isMessagesInput(input)
    ? { message: { role: "assistant", content: result }, isPartial }
    : { text: result, isPartial }
}

// function isAuthError(error: string) {
//   return (
//     error.startsWith(ErrorCode.ModelRejectedRequest) &&
//     error.split(": ")[1].startsWith("401")
//   )
// }

export default handler
