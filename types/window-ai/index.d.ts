declare module "window-ai" {
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

  type LLM =
    | "openai/gpt3.5"
    | "together/gpt-neoxt-20B"
    | "cohere/xlarge"
    | "local"

  interface CompletionOptions {
    onStreamResult?: (result: Output | null, error: string | null) => unknown
    temperature?: number
    maxTokens?: number
    stopSequences?: string[]
    model?: LLM
  }

  interface ChatMessage {
    content: string
    role: string
  }

  function getCurrentModel(): Promise<LLM>

  function getCompletion(
    input: Input,
    options?: CompletionOptions
  ): Promise<Output>
}

declare global {
  interface Window {
    ai: typeof ai
  }
}
