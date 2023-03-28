import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import { RequestState } from "~background/state/request"
import {
  CompletionRequest,
  ErrorCode,
  PortName,
  PortRequest,
  PortResponse
} from "~core/constants"
import { Result, err, ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"
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

  if (!req.body) {
    return res.send({
      error: ErrorCode.InvalidRequest
    })
  }

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

  if (window.id) {
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
  }

  permissionState.start(requestId, request)

  return new Promise<Result<true, ErrorCode>>((resolve, reject) => {
    permissionState.addCompletionListener(
      requestId,
      async (request, result) => {
        if (!result.permitted) {
          resolve(err(ErrorCode.PermissionDenied))
        } else {
          resolve(ok(true))
        }

        if (window.id) {
          // Close the window and throw an error if that fails
          try {
            await Extension.closeWindow(window.id)
          } catch (e) {
            // User may have closed the window manually, but something else might have,
            // so propagate the error
            reject(e)
          }
        }
      }
    )
  })
}

export default handler
