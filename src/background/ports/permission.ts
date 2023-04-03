import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import { RequestState } from "~background/state/request"
import {
  CompletionRequest,
  ErrorCode,
  POPUP_HEIGHT,
  POPUP_WIDTH,
  PortName,
  PortRequest,
  PortResponse
} from "~core/constants"
import { originManager } from "~core/managers/origin"
import { Result, err, ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"
import { Extension } from "~platforms/extension"

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
  if (permitted !== undefined) {
    // We're completing a request, no response needed
    permissionState.complete(id, req.body)
    return
  }

  const request = permissionState.get(id)
  if (!request) {
    return res.send({
      id,
      error: ErrorCode.RequestNotFound
    })
  }

  // We're starting a request, so send the request to the extension UI
  res.send({
    id,
    request
  })
}

export async function requestPermission(
  request: CompletionRequest,
  requestId: string
) {
  const originData = request.transaction.origin
  const origin = await originManager.getOrInit(
    request.transaction.origin.id,
    originData
  )
  if (origin.permissions === "allow") {
    log("Permission granted by user settings: ", origin)
    return ok(true)
  }

  const window = await Extension.openPopup(POPUP_WIDTH, POPUP_HEIGHT, {
    requestId
  })

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
