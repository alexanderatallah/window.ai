import type { Transaction } from "./managers/transaction"

export const PORT_NAME = "web41"

export enum ContentMessageType {
  Request = "request",
  Response = "response",
  Cancel = "cancel"
}

export enum ErrorCode {
  PermissionDenied = "PERMISSION_DENIED"
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
  | {
      nextRequestId: RequestId
    }

export type StreamResponse =
  | {
      text: string
    }
  | {
      error: ErrorCode | string
    }

export const IS_SERVER = typeof chrome === "undefined"
