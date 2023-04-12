import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import type { PortName, PortRequest, PortResponse } from "~core/constants"
import { configManager } from "~core/managers/config"
import { err, ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"
import { ErrorCode } from "~public-interface"

const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Model],
  PortResponse[PortName.Model]
> = async (req, res) => {
  log("Model port received message: ", req)

  if (!req.body) {
    return res.send(err(ErrorCode.InvalidRequest))
  }

  const { id } = req.body

  const currentModel = await configManager.getDefault()

  // We're starting a request, so send the request to the extension UI
  res.send({
    id,
    response: ok({ model: currentModel.id })
  })
}

export default handler
