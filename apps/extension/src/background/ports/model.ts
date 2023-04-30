import { ErrorCode } from "window.ai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import { type PortRequest, type PortResponse } from "~core/constants"
import { PortName } from "~core/constants"
import { AuthType, configManager } from "~core/managers/config"
import { err, ok } from "~core/utils/result-monad"
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
  if (request) {
    // TODO handle other model providers here by checking request.baseUrl
    // TODO request the user's permission to add the model provider
    const { metadata, shouldSetDefault } = request
    const config =
      (await configManager.forAuthAndModel(AuthType.External)) ||
      configManager.init(AuthType.External)
    const newConfig = {
      ...config,
      authMetadata: metadata
    }
    await configManager.save(newConfig)
    if (shouldSetDefault) {
      await configManager.setDefault(newConfig)
    }
  }

  const config = await configManager.getDefault()
  res.send({
    id,
    response: ok({ model: configManager.getCurrentModel(config) })
  })
}

export default handler
