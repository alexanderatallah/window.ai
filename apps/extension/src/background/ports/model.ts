import { ErrorCode } from "window.ai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import { type PortRequest, type PortResponse } from "~core/constants"
import { PortName } from "~core/constants"
import { AuthType, configManager } from "~core/managers/config"
import { err, isOk, ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"

const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Model],
  PortResponse[PortName.Model]
> = async (req, res) => {
  log("Model port received message: ", req)

  if (!req.body) {
    return res.send(err(ErrorCode.InvalidRequest))
  }

  const { id, request } = req.body
  if (!request) {
    const config = await configManager.getDefault()
    const result = await configManager.predictModel(config)
    return res.send({
      id,
      response: isOk(result) ? ok({ model: result.data }) : result
    })
  }
  // TODO handle other model providers here by checking request.baseUrl
  // TODO request the user's permission to add the model provider
  const { session, shouldSetDefault } = request
  const config = await configManager.getOrInit(AuthType.External)
  const newConfig = {
    ...config,
    baseUrl: undefined, // Fixes an issue where localhost interferes with prod
    session: session !== undefined ? session : config.session
  }
  // console.info("Saving new config: ", newConfig, " old config: ", config)
  await configManager.save(newConfig)
  if (shouldSetDefault) {
    await configManager.setDefault(newConfig)
  }
}

export default handler
