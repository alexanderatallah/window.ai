import type { ErrorCode, EventType, ModelID, Output } from "../public-interface"
import type { Transaction } from "./managers/transaction"
import type { Result } from "./utils/result-monad"

export enum PortName {
  Completion = "completion",
  Permission = "permission",
  Model = "model"
}

export interface PortRequest {
  [PortName.Completion]: { id: RequestId; request: CompletionRequest }
  [PortName.Permission]: { id: RequestId; permitted?: boolean }
  [PortName.Model]: { id: RequestId }
}

export interface PortResponse {
  [PortName.Completion]:
    | { id: RequestId; response: CompletionResponse }
    | { id?: RequestId; error: ErrorCode.InvalidRequest }
  [PortName.Permission]:
    | { id: RequestId; request: CompletionRequest }
    | {
        id?: RequestId
        error: ErrorCode.InvalidRequest | ErrorCode.RequestNotFound
      }
  [PortName.Model]:
    | { id: RequestId; response: ModelResponse }
    | { id?: RequestId; error: ErrorCode.InvalidRequest }
}

export type PortEvent = PortRequest | PortResponse

export enum ContentMessageType {
  Request = "request",
  Response = "response",
  Cancel = "cancel"
}

export type RequestId = string

export type CompletionRequest = {
  transaction: Transaction
  shouldStream?: boolean
}
export type CompletionResponse = Result<Output[], ErrorCode | string>

export type ModelRequest = { shouldListen?: boolean }
export type ModelResponse = Result<
  { model: ModelID; event?: EventType },
  ErrorCode
>

export const IS_SERVER =
  typeof process !== "undefined" && process?.versions?.node

// TODO keep in sync with Popup.tsx tailwind classes
export const POPUP_HEIGHT = 512
export const POPUP_WIDTH = 320
