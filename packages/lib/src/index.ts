import type { WindowAI } from "~contents/inpage"

// ChatML is a simple markup language for chat messages. More available here:
// https://github.com/openai/openai-python/blob/main/chatml.md
export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

// Input allows you to specify either a prompt string or a list of chat messages.
export type Input =
  | {
      prompt: string
    }
  | {
      messages: ChatMessage[]
    }

// Output can be either a string or a chat message, depending on which Input type you use.
export type Output =
  | {
      text: string
    }
  | {
      message: ChatMessage
    }

// CompletionOptions allows you to specify options for the completion request.
export interface CompletionOptions {
  // If specified, partial updates will be streamed to this handler as they become available,
  // and only the first partial update will be returned by the Promise.
  onStreamResult?: (result: Output | null, error: string | null) => unknown
  // What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
  // make the output more random, while lower values like 0.2 will make it more focused and deterministic.
  // Different models have different defaults.
  temperature?: number
  // How many completion choices to generate. Defaults to 1.
  numOutputs?: number
  // The maximum number of tokens to generate in the chat completion. Defaults to infinity, but the
  // total length of input tokens and generated tokens is limited by the model's context length.
  maxTokens?: number
  // Sequences where the API will stop generating further tokens.
  stopSequences?: string[]
  // Identifier of the model to use. Defaults to the user's current model, but can be overridden here.
  model?: ModelID
}

// ModelID is an enum of the available models.
// NOTE: this is an evolving standard, and may change in the future.
export enum ModelID {
  GPT3 = "openai/gpt3.5",
  GPT4 = "openai/gpt4",
  GPTNeo = "together/gpt-neoxt-20B",
  Cohere = "cohere/xlarge",
  Local = "local"
}

// Error codes emitted by the extension API
export enum ErrorCode {
  NotAuthenticated = "NOT_AUTHENTICATED",
  PermissionDenied = "PERMISSION_DENIED",
  RequestNotFound = "REQUEST_NOT_FOUND",
  InvalidRequest = "INVALID_REQUEST",
  ModelRejectedRequest = "MODEL_REJECTED_REQUEST"
}

// Event types emitted by the extension API
export enum EventType {
  // Fired when the user's model is changed.
  ModelChanged = "model_changed",
  // Fired for errors
  Error = "error"
}

export type RequestId = string

declare global {
  interface Window {
    ai: {
      getCompletion(
        input: Input,
        options: CompletionOptions
      ): Promise<Output | Output[]>

      getCurrentModel(): Promise<ModelID>
      addEventListener<T>(
        handler: (event: EventType, data: T | ErrorCode) => void
      ): RequestId
    }
  }
}

export const initWindowAI = async () => {
  // wait until the window.ai object is available
  if (!window.ai) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (window.ai) {
          clearInterval(interval)
          resolve(1)
        }
      }, 100)
    })
  }

  return window.ai
}
