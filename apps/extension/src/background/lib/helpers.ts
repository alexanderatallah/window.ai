import { ErrorCode, type RequestID } from "window.ai"

import {
  POPUP_HEIGHT,
  POPUP_WIDTH,
  RequestInterruptType
} from "~core/constants"
import { Extension } from "~core/extension"
import type { Err } from "~core/utils/result-monad"

async function _requestInterrupt(
  requestId: RequestID,
  type: RequestInterruptType
) {
  await Extension.openPopup(POPUP_WIDTH, POPUP_HEIGHT, {
    requestInterruptType: type,
    requestId
  })
}

export async function promptInterrupts(
  id: RequestID,
  result: Err<ErrorCode | string>
) {
  if (result.error === ErrorCode.NotAuthenticated) {
    return _requestInterrupt(id, RequestInterruptType.Authentication)
  } else if (result.error === ErrorCode.PaymentRequired) {
    return _requestInterrupt(id, RequestInterruptType.Payment)
  }
}
