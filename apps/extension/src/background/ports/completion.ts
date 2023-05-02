import {
  ErrorCode,
  type InferredOutput,
  type Input,
  type RequestID,
  isMessagesInput
} from "window.ai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import {
  POPUP_HEIGHT,
  POPUP_WIDTH,
  type PortRequest,
  type PortResponse,
  RequestInterruptType
} from "~core/constants"
import { PortName } from "~core/constants"
import { Extension } from "~core/extension"
import { configManager } from "~core/managers/config"
import { transactionManager } from "~core/managers/transaction"
import * as modelRouter from "~core/model-router"
import { type Err, err, isErr, isOk, ok } from "~core/utils/result-monad"
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

  const config = await configManager.forModelWithDefault(txn.model)

  if (modelRouter.shouldStream(config, request.shouldStream)) {
    const replies: string[] = []
    const errors: string[] = []

    const results = await modelRouter.stream(txn)

    for await (const result of results) {
      if (isOk(result)) {
        const outputs = [getOutput(txn.input, result.data, true)]
        res.send({ response: ok(outputs), id })
        replies.push(result.data)
      } else {
        res.send({ response: result, id })
        errors.push(result.error)
        if (isAuthError(result)) {
          requestAuth(id)
        }
      }
    }

    // Collect the replies and errors onto the txn
    txn.outputs = replies.length
      ? [getOutput(txn.input, replies.join(""))]
      : undefined
    txn.error = errors.join("") || undefined

    // Send the final output to the client, as non-partial
    if (txn.outputs) {
      res.send({ response: ok(txn.outputs), id })
    }
  } else {
    // TODO remove this code and make everything use modelRouter.stream
    // WIP PR: https://github.com/alexanderatallah/window.ai/pull/50
    const result = await modelRouter.complete(txn)

    if (isOk(result)) {
      const outputs = result.data.map((d) => getOutput(txn.input, d))
      res.send({ response: ok(outputs), id })
      txn.outputs = outputs
    } else {
      res.send({ response: result, id })
      txn.error = result.error
      if (isAuthError(result)) {
        requestAuth(id)
      }
    }
  }

  // Update the completion with the reply
  await transactionManager.save(txn)
}

function getOutput(
  input: Input,
  result: string,
  isPartial?: boolean
): InferredOutput<typeof input> {
  return isMessagesInput(input)
    ? { message: { role: "assistant", content: result }, isPartial }
    : { text: result, isPartial }
}

function isAuthError(error: Err<string>) {
  const errorParts = error.error.split(": ")
  return (
    errorParts[0] === ErrorCode.ModelRejectedRequest && errorParts[1] === "401"
  )
}

async function requestAuth(requestId: RequestID) {
  await Extension.openPopup(POPUP_WIDTH, POPUP_HEIGHT, {
    requestInterruptType: RequestInterruptType.Authentication,
    requestId
  })
}

export default handler
