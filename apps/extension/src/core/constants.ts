import type { EventRequest, EventResponse } from "~background/ports/events"

import type { ErrorCode, ModelID, Output } from "../public-interface"
import type { Transaction } from "./managers/transaction"
import type { Result } from "./utils/result-monad"

export enum PortName {
  Completion = "completion",
  Permission = "permission",
  Model = "model",
  Events = "events"
}

export interface PortRequest {
  [PortName.Completion]: { id: RequestId; request: CompletionRequest }
  [PortName.Permission]: {
    id?: RequestId
    request: { requesterId: RequestId; permitted?: boolean }
  }
  [PortName.Model]: { id: RequestId; request: ModelRequest }
  [PortName.Events]: { id?: RequestId; request: EventRequest<unknown> }
}

export interface PortResponse {
  [PortName.Completion]:
    | { id: RequestId; response: CompletionResponse }
    | { id?: RequestId; error: ErrorCode.InvalidRequest }
  [PortName.Permission]:
    | { requesterId: RequestId; requester: CompletionRequest }
    | {
        id?: RequestId
        error: ErrorCode.InvalidRequest | ErrorCode.RequestNotFound
      }
  [PortName.Model]:
    | { id: RequestId; response: ModelResponse }
    | { id?: RequestId; error: ErrorCode.InvalidRequest }
  [PortName.Events]:
    | { response: EventResponse<unknown> }
    | { error: ErrorCode.InvalidRequest }
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

export type ModelRequest = {}
export type ModelResponse = Result<{ model: ModelID }, ErrorCode>

export type { EventRequest, EventResponse }

export const IS_SERVER =
  typeof process !== "undefined" && process?.versions?.node

// TODO keep in sync with Popup.tsx tailwind classes
export const POPUP_HEIGHT = 512
export const POPUP_WIDTH = 320
