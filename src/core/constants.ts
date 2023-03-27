import type { Transaction } from "./managers/transaction"

export const PORT_NAME = "web41"

export enum ContentMessageType {
  Request = "request",
  Response = "response",
  Cancel = "cancel"
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
      error: string
    }
  | {
      nextRequestId: RequestId
    }

export interface StreamResponse {
  text: string
}

export const IS_SERVER = typeof chrome === "undefined"
