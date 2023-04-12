import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import type { PortName, PortRequest, PortResponse } from "~core/constants"
import { configManager } from "~core/managers/config"
import { Transaction, transactionManager } from "~core/managers/transaction"
import * as modelApi from "~core/model-api"
import { err, isErr, isOk, ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"
import { ErrorCode, Input, Output } from "~public-interface"

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

  const requestData = await makeRequestData(txn)

  if (request.shouldStream && modelApi.isStreamable(requestData.model)) {
    const replies: string[] = []
    const errors: string[] = []

    const results = await modelApi.stream(requestData)

    for await (const result of results) {
      if (isOk(result)) {
        const outputs = [getOutput(txn.input, result.data)]
        res.send({ response: ok(outputs), id })
        replies.push(result.data)
      } else {
        res.send({ response: result, id })
        errors.push(result.error)
      }
    }

    txn.outputs = replies.length
      ? [getOutput(txn.input, replies.join(""))]
      : undefined
    txn.error = errors.join("") || undefined
  } else {
    const result = await modelApi.complete(requestData)

    if (isOk(result)) {
      const outputs = result.data.map((d) => getOutput(txn.input, d))
      res.send({ response: ok(outputs), id })
      txn.outputs = outputs
    } else {
      res.send({ response: result, id })
      txn.error = result.error
    }
  }

  // Update the completion with the reply
  await transactionManager.save(txn)
}

function getOutput(input: Input, result: string): Output {
  return "messages" in input
    ? { message: { role: "assistant", content: result } }
    : { text: result }
}

async function makeRequestData(txn: Transaction): Promise<modelApi.Request> {
  const { input, stopSequences, maxTokens, temperature, numOutputs } = txn
  const model = txn.model || (await configManager.getDefault()).id
  const config = await configManager.get(model)

  return {
    input,
    stopSequences,
    maxTokens,
    model,
    temperature,
    numOutputs,
    modelUrl: config?.completionUrl,
    apiKey: config?.apiKey
  }
}

export default handler
