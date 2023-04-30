import { ErrorCode, type RequestID } from "window.ai"

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
import { AuthType, configManager } from "~core/managers/config"
import type { Transaction } from "~core/managers/transaction"
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

export async function requestAuth(requestId: RequestID) {
  await Extension.openPopup(POPUP_WIDTH, POPUP_HEIGHT, {
    requestInterruptType: RequestInterruptType.Authentication,
    requestId
  })
}

export default handler
