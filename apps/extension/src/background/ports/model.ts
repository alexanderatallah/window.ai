import { ErrorCode } from "window.ai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import type { PortRequest, PortResponse } from "~core/constants"
import { PortName } from "~core/constants"
import { configManager } from "~core/managers/config"
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

  const { id } = req.body

  const config = await configManager.getDefault()

  res.send({
    id,
    response: ok({ model: configManager.getCurrentModel(config) })
  })
}

export default handler
