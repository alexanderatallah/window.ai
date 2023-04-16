import type { WindowAI } from "~contents/inpage"

// window.ai is injected into every webpage, allowing apps to avoid having to
// include scripts or hard-code network requests to use AI models.
declare global {
  interface Window {
    ai: typeof WindowAI
  }
}

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
  // Arbitrary strings are allowed, and will be passed to the model as `model`,
  // but Window will only pre-configure those in ModelID.
  model?: ModelID | string
}

// ModelID is an enum of the models that Window can pre-configure for first-time users.
// It's specified by the model's author, a "/", and the name of the model
// as provided by the author, including those seen in https://huggingface.co/models.
// Closed models by an organization will have the org-provided model id after the "/".
export enum ModelID {
  GPT3 = "openai/gpt-3.5-turbo",
  GPT4 = "openai/gpt-4",
  Together = "togethercomputer/GPT-NeoXT-Chat-Base-20B",
  Cohere = "cohere/command-xlarge-nightly"
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
