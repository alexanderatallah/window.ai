import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import * as apiExternal from "~core/api"
import * as apiLocal from "~core/api-local"
import { ErrorCode, PortName, PortRequest, PortResponse } from "~core/constants"
import { LLM, configManager } from "~core/managers/config"
import { Transaction, transactionManager } from "~core/managers/transaction"
import { isErr, isOk } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"
import type { Request } from "~pages/api/_common"

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
  // TODO consolidate API
  const api = isLocalhost(requestData) ? apiLocal : apiExternal

  if (request.shouldStream) {
    const replies = []
    const errors = []

    const results = await api.stream("/api/model/stream", requestData)

    for await (const result of results) {
      if (isOk(result)) {
        res.send({ response: result, id })
        replies.push(result.data)
      } else {
        res.send({ response: result, id })
        errors.push(result.error)
      }
    }

    txn.completion = replies.join("") || undefined
    txn.error = errors.join("") || undefined
  } else {
    const result = await api.post("/api/model/complete", requestData)

    if (isOk(result)) {
      res.send({ response: result, id })
      txn.completion = result.data
    } else {
      res.send({ response: result, id })
      txn.error = result.error
    }
  }

  // Update the completion with the reply
  await transactionManager.save(txn)
}

function isLocalhost(requestData: Request) {
  return requestData.modelId === LLM.Local
}

async function makeRequestData(txn: Transaction): Promise<Request> {
  const config = await configManager.get(LLM.GPT3)
  const modelId = txn.model || (await configManager.getDefault()).id

  return {
    prompt: txn.prompt,
    modelId,
    modelUrl: config?.completionUrl,
    apiKey: config?.apiKey
  }
}

export default handler
