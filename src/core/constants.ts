
export const PORT_NAME = "web41"

export enum ContentMessageType {
  Request = "request",
  Response = "response",
  Cancel = "cancel"
}

export interface ContentMessage {
  prompt: string
  shouldStream?: boolean
}