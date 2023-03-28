import type { Transaction } from "./managers/transaction"

export enum PortName {
  Window = "window",
  Permission = "permission"
}

export interface PortRequest {
  [PortName.Window]: { id: RequestId; request: CompletionRequest }
  [PortName.Permission]: { id: RequestId; permitted?: boolean }
}

export interface PortResponse {
  [PortName.Window]: { id: RequestId; response: CompletionResponse }
  [PortName.Permission]:
    | { id: RequestId; request: CompletionRequest }
    | { id: RequestId; error: ErrorCode }
}

export type PortEvent = PortRequest | PortResponse

export enum ContentMessageType {
  Request = "request",
  Response = "response",
  Cancel = "cancel"
}

export enum ErrorCode {
  PermissionDenied = "PERMISSION_DENIED",
  RequestNotFound = "REQUEST_NOT_FOUND"
}

export type RequestId = string

export interface CompletionRequest {
  transaction: Transaction
  shouldStream?: boolean
  isLocal?: boolean
}

export type CompletionResponse =
  | {
      text: string
    }
  | {
      error: ErrorCode | string
    }

export type StreamResponse =
  | {
      text: string
    }
  | {
      error: ErrorCode | string
    }
  | {
      nextRequestId: RequestId
    }

export const IS_SERVER = typeof chrome === "undefined"
