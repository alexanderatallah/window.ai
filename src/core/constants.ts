
export const PORT_NAME = "web41"

export enum ContentMessageType {
  Request = "request",
  Response = "response",
  Cancel = "cancel"
}

export interface CompletionRequest {
  prompt: string
  shouldStream?: boolean
}

export interface CompletionResponse {
  completion: string
}

export interface StreamResponse {
  text: string
}
