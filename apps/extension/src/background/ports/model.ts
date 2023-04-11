import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import { addEventListener } from "~background/messages/event"
import type { PortName, PortRequest, PortResponse } from "~core/constants"
import { configManager } from "~core/managers/config"
import { ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"
import { ErrorCode } from "~public-interface"

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

  const { id, request } = req.body
  if (request.shouldListen) {
    if (!req.port) {
      return res.send({
        id,
        error: ErrorCode.InvalidRequest
      })
    }
    addEventListener(req.port)
    // We're adding a listener, no response needed
    return
  }

  const currentModel = await configManager.getDefault()

  // We're starting a request, so send the request to the extension UI
  res.send({
    id,
    response: ok({ model: currentModel.id })
  })
}

export default handler
