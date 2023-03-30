import type { Transaction } from "./managers/transaction"
import type { Result } from "./utils/result-monad"

export enum PortName {
  Window = "window",
  Permission = "permission"
}

export interface PortRequest {
  [PortName.Window]: { id: RequestId; request: CompletionRequest }
  [PortName.Permission]: { id: RequestId; permitted?: boolean }
}

export interface PortResponse {
  [PortName.Window]:
    | { id: RequestId; response: CompletionResponse | StreamResponse }
    | { id?: RequestId; error: ErrorCode.InvalidRequest }
  [PortName.Permission]:
    | { id: RequestId; request: CompletionRequest }
    | {
        id?: RequestId
        error: ErrorCode.InvalidRequest | ErrorCode.RequestNotFound
      }
}

export type PortEvent = PortRequest | PortResponse

export enum ContentMessageType {
  Request = "request",
  Response = "response",
  Cancel = "cancel"
}

export enum ErrorCode {
  NotAuthenticated = "NOT_AUTHENTICATED",
  PermissionDenied = "PERMISSION_DENIED",
  RequestNotFound = "REQUEST_NOT_FOUND",
  InvalidRequest = "INVALID_REQUEST"
}

export type RequestId = string

export interface CompletionRequest {
  transaction: Transaction
  shouldStream?: boolean
}

export type CompletionResponse = Result<string, ErrorCode | string>

export type StreamResponse = CompletionResponse

export const IS_SERVER =
  typeof process !== "undefined" && process?.versions?.node

// TODO keep in sync with Popup.tsx tailwind classes
export const POPUP_HEIGHT = 512
export const POPUP_WIDTH = 320
