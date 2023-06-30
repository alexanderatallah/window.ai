import { ErrorCode } from "window.ai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import { RequestState } from "~background/lib/request-state"
import {
  type CompletionRequest,
  type MediaRequest,
  type PortRequest,
  type PortResponse,
  RequestInterruptType
} from "~core/constants"
import { POPUP_HEIGHT, POPUP_WIDTH, PortName } from "~core/constants"
import { Extension } from "~core/extension"
import { originManager } from "~core/managers/origin"
import type { Result } from "~core/utils/result-monad"
import { err, ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"

const permissionState = new RequestState<
  CompletionRequest | MediaRequest,
  PortRequest[PortName.Permission]["request"]
>()
const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Permission],
  PortResponse[PortName.Permission]
> = async (req, res) => {
  log("Permission port received message: ", req)

  if (!req.body) {
    return res.send(err(ErrorCode.InvalidRequest))
  }

  const { requesterId, permitted } = req.body.request
  if (permitted !== undefined) {
    // We're completing a request, no response needed
    permissionState.finish(requesterId, req.body.request)
    return
  }

  const requester = permissionState.get(requesterId)
  if (!requester) {
    return res.send({
      id: req.body.id,
      error: ErrorCode.RequestNotFound
    })
  }

  // We're starting a request, so send the request to the extension UI
  res.send({
    requesterId,
    requester
  })
}

export async function requestPermission(
  request: CompletionRequest | MediaRequest,
  requestId: string
): Promise<Result<true, ErrorCode>> {
  const originData = request.transaction.origin
  const origin = await originManager.getOrInit(originData.id, originData)
  if (origin.permissions === "allow") {
    log("Permission granted by user settings: ", origin)
    return ok(true)
  }

  const window = await Extension.openPopup(POPUP_WIDTH, POPUP_HEIGHT, {
    requestId,
    requestInterruptType: RequestInterruptType.Permission
  })

  if (window.id) {
    Extension.addOnRemovedListener(window.id, () => {
      if (permissionState.get(requestId)) {
        // User closed window without responding, so assume
        // no permission granted
        permissionState.finish(requestId, {
          requesterId: requestId,
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
        const { permitted } = result
        if (!permitted) {
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
