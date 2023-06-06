import {
  ErrorCode,
  ModelID,
} from "window.ai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import {
  type PortRequest,
  type PortResponse,
} from "~core/constants"
import { PortName } from "~core/constants"
import { type Config, configManager, AuthType } from "~core/managers/config"
import {
  transactionManager
} from "~core/managers/transaction"
import { Extension } from "~core/extension"
import {
  err,
  isErr,
  isOk,
  ok,
  unknownErr
} from "~core/utils/result-monad"
import { log } from "~core/utils/utils"

import { requestPermission } from "./permission"
import { getMediaCaller } from "~core/media"
import { originManager } from "~core/managers/origin"
import { NO_TXN_REFERRER } from "~core/model-router"
import { _maybeInterrupt } from "~background/lib/helpers"

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

  if ('messages' in txn.input) {
    return res.send(err(ErrorCode.InvalidRequest))
  }

  // temporarily, use external model config
  const config = await configManager.forAuthAndModel(AuthType.External, ModelID.Shap_e)
  // if not credentialed, present with login flow
  if(!configManager.isCredentialed(config)){
    _maybeInterrupt(id, err(ErrorCode.NotAuthenticated))
    return res.send({ response: err(ErrorCode.NotAuthenticated), id })
  }

  // only shap-e supported for now
  txn.routedModel = ModelID.Shap_e
  await transactionManager.save(txn)

  const modelCaller = getMediaCaller(ModelID.Shap_e)
  let result
  try {
    result = await modelCaller.generate(txn.input, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: txn.routedModel,
      origin: txn ? originManager.url(txn.origin) : NO_TXN_REFERRER,
      num_generations: txn.numOutputs,
      num_inference_steps: txn.numInferenceSteps,
    })
  } catch (error) {
    result = unknownErr(error)
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

export default handler