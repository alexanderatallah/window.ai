import type { WindowAI } from "~contents/inpage"

declare global {
  interface Window {
    ai: typeof WindowAI
  }
}

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

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

export enum ModelID {
  GPT3 = "openai/gpt3.5",
  GPTNeo = "together/gpt-neoxt-20B",
  Cohere = "cohere/xlarge",
  Local = "local"
}

export interface CompletionOptions {
  // If specified, partial updates will be streamed to this handler as they become available,
  // and only the first partial update will be returned by the Promise.
  onStreamResult?: (result: Output | null, error: string | null) => unknown
  // What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
  // make the output more random, while lower values like 0.2 will make it more focused and deterministic.
  // Different models have different defaults.
  temperature?: number
  // How many chat completion choices to generate for each input message. Defaults to 1.
  // TODO n?: number
  // The maximum number of tokens to generate in the chat completion. Defaults to infinity, but the
  // total length of input tokens and generated tokens is limited by the model's context length.
  maxTokens?: number
  // Sequences where the API will stop generating further tokens.
  stopSequences?: string[]
  // Identifier of the model to use. Defaults to the user's current model, but can be overridden here.
  model?: ModelID
}
