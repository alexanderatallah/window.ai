import type {
  PortName,
  PortRequest,
  PortResponse
} from "apps/extension/src/core/constants"
import { configManager } from "apps/extension/src/core/managers/config"
import { ok } from "apps/extension/src/core/utils/result-monad"
import { log } from "apps/extension/src/core/utils/utils"
import { ErrorCode } from "apps/extension/src/public-interface"

import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

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
