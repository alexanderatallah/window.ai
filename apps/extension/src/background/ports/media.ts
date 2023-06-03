import {
  ErrorCode,
  type RequestID,
  ModelID,
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
import { type Config, configManager } from "~core/managers/config"
import {
  type Transaction,
  transactionManager
} from "~core/managers/transaction"
// import * as modelRouter from "~core/model-router"
import {
  type Err,
  type Result,
  err,
  isErr,
  isOk,
  ok
} from "~core/utils/result-monad"
import { log } from "~core/utils/utils"

import { requestPermission } from "./permission"
import { getMediaCaller } from "~core/media"

const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Media],
  PortResponse[PortName.Media]
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
  console.log(config.session)
  // only allow openrouter for now, while in BETA
  if(!config.session){
    return res.send({ response: err(ErrorCode.ModelRejectedRequest), id })
  }

  const predictedModel = await _getMediaModel(config, txn)
  if (!isOk(predictedModel)) {
    _maybeInterrupt(id, predictedModel)
    return res.send({ response: predictedModel, id })
  }
  txn.routedModel = predictedModel.data

  await transactionManager.save(txn)

  const modelCaller  = await getMediaCaller(txn.routedModel as ModelID)
  let result;
  try {
    result = await modelCaller.generate(txn.input as any, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: txn.routedModel,
      origin: txn.origin,
      num_generations: txn.numOutputs,
      num_inference_steps: txn.numInferenceSteps,
      extension: txn.extension,
    })
  }
  catch (error) {
    return res.send({ response: err(ErrorCode.InvalidRequest), id })
  }
  
  if (isOk(result)) {
    const outputs = result.data
    res.send({ response: ok(outputs), id })
    txn.outputs = outputs
  } else {
    res.send({ response: result, id })
    txn.error = result.error
    _maybeInterrupt(id, result)
  }
  // Update the generation with the reply and model used
  await transactionManager.save(txn)
}

async function _getMediaModel(
  config: Config,
  txn: Transaction
): Promise<Result<string, string>> {
  if (txn.model) {
    return ok(txn.model)
  }
  // fallback to openrouter for now
  return Promise.resolve(ok(ModelID.Shap_e))
}

async function _maybeInterrupt(id: RequestID, result: Err<ErrorCode | string>) {
  if (result.error === ErrorCode.NotAuthenticated) {
    return _requestInterrupt(id, RequestInterruptType.Authentication)
  } else if (result.error === ErrorCode.PaymentRequired) {
    return _requestInterrupt(id, RequestInterruptType.Payment)
  }
}

async function _requestInterrupt(
  requestId: RequestID,
  type: RequestInterruptType
) {
  await Extension.openPopup(POPUP_WIDTH, POPUP_HEIGHT, {
    requestInterruptType: type,
    requestId
  })
}

export default handler