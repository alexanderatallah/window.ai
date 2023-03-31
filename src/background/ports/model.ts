import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import { ErrorCode, PortName, PortRequest, PortResponse } from "~core/constants"
import { configManager } from "~core/managers/config"
import { ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"

const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Model],
  PortResponse[PortName.Model]
> = async (req, res) => {
  log("Model port received message: ", req)

  if (!req.body) {
    return res.send({
      error: ErrorCode.InvalidRequest
    })
  }

  const { id } = req.body

  const currentModel = await configManager.getDefault()

  // We're starting a request, so send the request to the extension UI
  res.send({
    id,
    response: ok(currentModel.id)
  })
}

export default handler
