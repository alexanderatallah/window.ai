// ChatML is a simple markup language for chat messages. More available here:
// https://github.com/openai/openai-python/blob/main/chatml.md
export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type ChatRole = ChatMessage["role"]

export type PromptInput = {
  prompt: string
}

export type MessagesInput = {
  messages: ChatMessage[]
}

// Input allows you to specify either a prompt string or a list of chat messages.
export type Input = PromptInput | MessagesInput

export function isPromptInput(input: Input): input is PromptInput {
  return "prompt" in input
}

export function isMessagesInput(input: Input): input is MessagesInput {
  return "messages" in input
}

export type TextOutput = {
  text: string
}

export type MessageOutput = {
  message: ChatMessage
}

// Output can be either a string or a chat message, depending on which Input type you use.
export type Output = TextOutput | MessageOutput

export function isTextOutput(output: Output): output is TextOutput {
  return "text" in output
}

export function isMessageOutput(output: Output): output is MessageOutput {
  return "message" in output
}

export type InferredOutput<TInput> = TInput extends MessagesInput
  ? MessageOutput
  : TInput extends PromptInput
  ? TextOutput
  : Output

// CompletionOptions allows you to specify options for the completion request.
export interface CompletionOptions<TModel, TInput extends Input = Input> {
  // If specified, partial updates will be streamed to this handler as they become available,
  // and only the first partial update will be returned by the Promise.
  onStreamResult?: (
    result: InferredOutput<TInput> | null,
    error: string | null
  ) => unknown
  // What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
  // make the output more random, while lower values like 0.2 will make it more focused and deterministic.
  // Different models have different defaults.
  temperature?: number
  // The maximum number of tokens to generate in the chat completion. Defaults to infinity, but the
  // total length of input tokens and generated tokens is limited by the model's context length.
  maxTokens?: number
  // Sequences where the API will stop generating further tokens.
  stopSequences?: string[]
  // Identifier of the model to use. Defaults to the user's current model, but can be overridden here.
  model?: TModel
  // How many completion choices to generate. Defaults to 1.
  numOutputs?: number
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

export type RequestID = string

export type EventListenerHandler<T> = (
  event: EventType,
  data: T | ErrorCode
) => void

export const VALID_DOMAIN = "https://windowai.io" as const

export interface WindowAI<TModel = string> {
  __window_ai_metadata__: {
    domain: typeof VALID_DOMAIN
    version: string
  }

  getCompletion<TInput extends Input = Input>(
    input: TInput,
    options?: CompletionOptions<TModel, TInput>
  ): Promise<InferredOutput<TInput>[]>

  getCurrentModel(): Promise<TModel>

  addEventListener<T>(handler: EventListenerHandler<T>): RequestID
}

declare global {
  interface Window {
    ai: WindowAI
  }
}

// Checking against other window.ai implementations
export function hasWindowAI() {
  return typeof globalThis.window.ai?.getCompletion === "function"

  // Ref: https://github.com/alexanderatallah/window.ai/pull/34#discussion_r1170544209
  // return (
  //   !!globalThis.window.ai?.__window_ai_metadata__ &&
  //   window.ai.__window_ai_metadata__.domain === VALID_DOMAIN
  // )
}

const DEFAULT_WAIT_OPTIONS = {
  interval: 100,
  timeout: 2_400 // https://github.com/alexanderatallah/window.ai/pull/34#discussion_r1170545022
}

export async function waitForWindowAI(opts = DEFAULT_WAIT_OPTIONS) {
  if (hasWindowAI()) {
    return
  }

  await new Promise((resolve, reject) => {
    let counter = 0
    const timerInterval = setInterval(() => {
      counter += opts.interval
      if (counter > opts.timeout) {
        clearInterval(timerInterval)
        reject(new Error("window.ai not found"))
      }

      if (hasWindowAI()) {
        clearInterval(timerInterval)
        resolve(true)
      }
    }, opts.interval)
  })
}

export const getWindowAI = async (opts = DEFAULT_WAIT_OPTIONS) => {
  // wait until the window.ai object is available
  await waitForWindowAI(opts)

  // Context: https://github.com/alexanderatallah/window.ai/pull/43#discussion_r1178316153
  const _getCompletion = globalThis.window.ai.getCompletion
  globalThis.window.ai.getCompletion = async (input, options = {}) => {
    const output = await _getCompletion(input, options)
    return Array.isArray(output) ? output : [output]
  }
  return globalThis.window.ai
}
