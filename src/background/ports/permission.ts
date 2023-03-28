import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import { RequestState } from "~background/state/request"
import {
  CompletionRequest,
  ErrorCode,
  PortName,
  PortRequest,
  PortResponse
} from "~core/constants"
import { log } from "~core/utils"
import { Extension } from "~platforms/extension"

const NOTIFICATION_HEIGHT = 600
const NOTIFICATION_WIDTH = 320

const permissionState = new RequestState<
  CompletionRequest,
  PortRequest[PortName.Permission]
>()
const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Permission],
  PortResponse[PortName.Permission]
> = async (req, res) => {
  log("Permission port received message: ", req)

  const { id, permitted } = req.body
  if (permitted === undefined) {
    const request = permissionState.get(id)
    if (request) {
      res.send({
        id,
        request
      })
    } else {
      res.send({
        id,
        error: ErrorCode.RequestNotFound
      })
    }
  } else {
    permissionState.complete(id, req.body)
  }
}

export async function requestPermission(
  request: CompletionRequest,
  requestId: string
) {
  const window = await Extension.openPopup(
    NOTIFICATION_WIDTH,
    NOTIFICATION_HEIGHT,
    { requestId }
  )
  permissionState.start(requestId, request)
  return new Promise<{ error: ErrorCode } | { success: true }>(
    (resolve, reject) => {
      permissionState.addCompletionListener(
        requestId,
        async (request, result) => {
          if (!result.permitted) {
            resolve({ error: ErrorCode.PermissionDenied })
          } else {
            resolve({ success: true })
          }

          // Close the window and throw an error if that fails
          try {
            await Extension.closeWindow(window.id)
          } catch (e) {
            reject(e)
          }
        }
      )
    }
  )
}

export default handler
