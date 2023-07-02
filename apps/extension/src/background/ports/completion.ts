import {
  ErrorCode,
  type InferredOutput,
  type Input,
  isMessagesInput
} from "window.ai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import { promptInterrupts } from "~background/lib/helpers"
import { type PortRequest, type PortResponse } from "~core/constants"
import { PortName } from "~core/constants"
import { Extension } from "~core/extension"
import { type Config, configManager } from "~core/managers/config"
import {
  type Transaction,
  transactionManager
} from "~core/managers/transaction"
import * as modelRouter from "~core/model-router"
import { type Result, err, isErr, isOk, ok } from "~core/utils/result-monad"
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
  const config = await configManager.forModelWithDefault(txn.model)

  const shouldStream = await modelRouter.shouldStream(config, request)
  const predictedModel = await _getCompletionModel(config, txn, shouldStream)
  if (!isOk(predictedModel)) {
    promptInterrupts(id, predictedModel)
    return res.send({ response: predictedModel, id })
  }
  txn.routedModel = predictedModel.data

  await transactionManager.save(txn)

  if (shouldStream) {
    const replies: string[] = []
    const errors: string[] = []

    const results = await modelRouter.stream(config, txn)

    for await (const result of results) {
      if (isOk(result)) {
        const outputs = [_getOutput(txn.input, result.data, true)]
        res.send({ response: ok(outputs), id })
        replies.push(result.data)
      } else {
        res.send({ response: result, id })
        errors.push(result.error)
        promptInterrupts(id, result)
      }
    }

    // Collect the replies and errors onto the txn
    txn.outputs = replies.length
      ? [_getOutput(txn.input, replies.join(""))]
      : undefined
    txn.error = errors.join("") || undefined

    // Send the final output to the client, as non-partial
    if (txn.outputs) {
      res.send({ response: ok(txn.outputs), id })
    }
  } else {
    // TODO remove this code and make everything use modelRouter.stream
    // WIP PR: https://github.com/alexanderatallah/window.ai/pull/50
    const result = await modelRouter.complete(config, txn)

    if (isOk(result)) {
      const outputs = result.data.map((d) => _getOutput(txn.input, d))
      res.send({ response: ok(outputs), id })
      txn.outputs = outputs
    } else {
      res.send({ response: result, id })
      txn.error = result.error
      promptInterrupts(id, result)
    }
  }

  // Update the completion with the reply and model used
  await transactionManager.save(txn)
}

async function _getCompletionModel(
  config: Config,
  txn: Transaction,
  shouldStream: boolean
): Promise<Result<string, string>> {
  if (txn.model) {
    return ok(txn.model)
  }
  return configManager.predictModel(config, txn, shouldStream)
}

function _getOutput(
  input: Input,
  result: string,
  isPartial?: boolean
): InferredOutput<typeof input> {
  return isMessagesInput(input)
    ? { message: { role: "assistant", content: result }, isPartial }
    : { text: result, isPartial }
}
export default handler
