import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import {
  ErrorCode,
  Input,
  Output,
  PortName,
  PortRequest,
  PortResponse
} from "~core/constants"
import { LLM, configManager } from "~core/managers/config"
import { Transaction, transactionManager } from "~core/managers/transaction"
import * as modelApi from "~core/model-api"
import { isErr, isOk, ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"

import { requestPermission } from "./permission"

const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Completion],
  PortResponse[PortName.Completion]
> = async (req, res) => {
  log("Background received message: ", req)

  if (!req.body) {
    return res.send({
      error: ErrorCode.InvalidRequest
    })
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

  if (request.shouldStream) {
    const replies: string[] = []
    const errors: string[] = []

    const results = await modelApi.stream(requestData)

    for await (const result of results) {
      if (isOk(result)) {
        const output = getOutput(txn.input, result.data)
        res.send({ response: ok(output), id })
        replies.push(result.data)
      } else {
        res.send({ response: result, id })
        errors.push(result.error)
      }
    }

    txn.output = replies.length
      ? getOutput(txn.input, replies.join(""))
      : undefined
    txn.error = errors.join("") || undefined
  } else {
    const result = await modelApi.complete(requestData)

    if (isOk(result)) {
      const output = getOutput(txn.input, result.data)
      res.send({ response: ok(output), id })
      txn.output = output
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
  const { input, stopSequences, maxTokens, temperature } = txn
  const model = txn.model || (await configManager.getDefault()).id
  const config = await configManager.get(model)

  return {
    input,
    stopSequences,
    maxTokens,
    model,
    temperature,
    modelUrl: config?.completionUrl,
    apiKey: config?.apiKey
  }
}

export default handler
