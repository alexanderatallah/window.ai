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

  Extension.addOnRemovedListener(window.id, () => {
    if (permissionState.get(requestId)) {
      // User closed window without responding, so assume
      // no permission granted
      permissionState.complete(requestId, {
        id: requestId,
        permitted: false
      })
    }
    // Otherwise, it's being programmatically closed, so we don't need to do anything
  })

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
            // User may have closed the window manually, but something else might have,
            // so propagate the error
            reject(e)
          }
        }
      )
    }
  )
}

export default handler
