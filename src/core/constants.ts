import type { Transaction } from "./models/transaction"

export const PORT_NAME = "web41"

export enum ContentMessageType {
  Request = "request",
  Response = "response",
  Cancel = "cancel"
}

export interface CompletionRequest {
  transaction: Transaction
  shouldStream?: boolean
  isLocal?: boolean
}

export interface CompletionResponse {
  text: string
}

export interface StreamResponse {
  text: string
}

export const IS_SERVER = typeof chrome === "undefined"

export const BACKGROUND_CLASS = "bg-slate-200 dark:bg-slate-800"
