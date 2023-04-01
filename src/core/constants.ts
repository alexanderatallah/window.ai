import type { ChatMessage } from "./llm/model"
import type { LLM } from "./managers/config"
import type { Transaction } from "./managers/transaction"
import type { Result } from "./utils/result-monad"

export type Input =
  | {
      prompt: string
    }
  | {
      messages: ChatMessage[]
    }

export type Output =
  | {
      text: string
    }
  | {
      message: ChatMessage
    }

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

export enum ErrorCode {
  NotAuthenticated = "NOT_AUTHENTICATED",
  PermissionDenied = "PERMISSION_DENIED",
  RequestNotFound = "REQUEST_NOT_FOUND",
  InvalidRequest = "INVALID_REQUEST"
}

export type RequestId = string

export type CompletionRequest = {
  transaction: Transaction
  shouldStream?: boolean
}
export type CompletionResponse = Result<Output, ErrorCode | string>

export type ModelRequest = {}
export type ModelResponse = Result<LLM, ErrorCode>

export const IS_SERVER =
  typeof process !== "undefined" && process?.versions?.node

// TODO keep in sync with Popup.tsx tailwind classes
export const POPUP_HEIGHT = 512
export const POPUP_WIDTH = 320
