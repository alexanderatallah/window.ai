export { hasWindowAI, getWindowAI, waitForWindowAI } from "./init"
export { parseModelID, ModelID } from "./model"

declare global {
  interface Window {
    ai: WindowAI
  }
}

export enum MediaExtension {
  PLY = "ply"
}

export function isMediaExtension(
  extension: string
): extension is MediaExtension {
  return Object.values(MediaExtension).includes(extension as MediaExtension)
}

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
  isPartial?: boolean
}

export type MessageOutput = {
  message: ChatMessage
  isPartial?: boolean
}

export type MediaOutput = {
  uri: string
  url?: string
}

// Output can be either a string or a chat message, or media output, depending on which Input type and function you use.
export type Output = TextOutput | MessageOutput | MediaOutput

export function isTextOutput(output: Output): output is TextOutput {
  return "text" in output
}

export function isMessageOutput(output: Output): output is MessageOutput {
  return "message" in output
}

export function isMediaOutput(output: Output): output is MediaOutput {
  return "uri" in output
}

export function isMediaHosted(output: MediaOutput) {
  return "url" in output && !!output.url
}

export type InferredOutput<TInput> = TInput extends MessagesInput
  ? MessageOutput
  : TInput extends PromptInput
  ? TextOutput | MediaOutput
  : Output

// Base set of options for all requests.
export interface Options<TModel, TInput extends Input = Input> {
  // Identifier of the model to use. Defaults to the user's current model, but can be overridden here.
  model?: TModel
  // How many completion choices to attempt to generate. Defaults to 1. If the
  // model doesn't support more than one, then an array with a single element will be returned.
  numOutputs?: number
}

// CompletionOptions allows you to specify options for the completion request.
export interface CompletionOptions<TModel, TInput extends Input = Input>
  extends Options<TModel, TInput> {
  // If specified, partial updates will be streamed to this handler as they become available,
  // and only the first partial update will be returned by the Promise.
  // NOT GUARANTEED to return results by every model, so make sure you handle the promise
  // and only use this to improve UX.
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
}

// ThreeDOptions  you to specify options for your generation request.
export interface ThreeDOptions<TModel> extends Options<TModel> {
  // The number of inference steps to run. Defaults to 32, with specific default values for each model.
  numInferenceSteps?: number
}

export function isCompletionOptions(
  options: Options<string, Input>
): options is CompletionOptions<string, Input> {
  return (
    "temperature" in options ||
    "maxTokens" in options ||
    "stopSequences" in options
  )
}

// Error codes emitted by the extension API
export enum ErrorCode {
  NotAuthenticated = "NOT_AUTHENTICATED",
  PermissionDenied = "PERMISSION_DENIED",
  RequestNotFound = "REQUEST_NOT_FOUND",
  InvalidRequest = "INVALID_REQUEST",
  PaymentRequired = "PAYMENT_REQUIRED",
  ModelRejectedRequest = "MODEL_REJECTED_REQUEST"
}

export function isKnownError(err: string): err is ErrorCode {
  return Object.values(ErrorCode).includes(err as ErrorCode)
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

export type ModelProviderOptions = {
  // baseUrl is used to identify the model provider
  baseUrl: string
  // Session information for the current user. Set to null
  // to sign out the user
  session?: {
    email?: string
    walletAddress?: string
    expiresAt?: number
    paymentUrl?: string
    settingsUrl?: string
  } | null
  // Whether to set this model provider as the default for the user.
  shouldSetDefault?: boolean //
}

export const VALID_DOMAIN = "https://windowai.io" as const

export interface WindowAI<TModel = string> {
  /**
   * Metadata containing the domain and version of the extension API
   */
  __window_ai_metadata__: {
    domain: typeof VALID_DOMAIN
    version: string
  }

  /** Generate text completions from the specified (or preferred) model.
   * @param input The input to use for the completion.
   * @param options Options for the completion request.
   * @returns A promise that resolves to an array of completion results.
   */
  generateText<TInput extends Input = Input>(
    input: TInput,
    options?: CompletionOptions<TModel, TInput>
  ): Promise<InferredOutput<TInput>[]>

  /** Generates a 3D Object from a specified model.
   * @param input The input to use for the object generation.
   * @param options Options for the object generation request
   * @returns A promise that resolves a object generation of type MediaOutput[].
   */
  BETA_generate3DObject(
    input: PromptInput,
    options?: ThreeDOptions<TModel>
  ): Promise<MediaOutput[]>

  /**
   * Get or stream a completion from the specified (or preferred) model.
   * @param input The input to use for the completion.
   * @param options Options for the completion request.
   * @returns A promise that resolves to an array of completion results.
   * @deprecated Use generateText instead
   */
  getCompletion<TInput extends Input = Input>(
    input: TInput,
    options?: CompletionOptions<TModel, TInput>
  ): Promise<InferredOutput<TInput>[]>

  /** Get the user's current model.
   * @returns A promise that resolves to the user's current model, or
   *          undefined if not available.
   */
  getCurrentModel(): Promise<TModel | undefined>

  /**
   * Add an event listener for all event types.
   * @param handler The handler to call when any event is emitted.
   * @returns A request ID that can be used to remove the event listener.
   */
  addEventListener<T>(handler: EventListenerHandler<T>): RequestID

  /**
   * Update the external model provider.
   * @param options The options for the model provider.
   *                If metadata is undefined, logs out the user.
   * @returns A promise that resolves to the user's current model, or
   *          undefined if not available.
   */
  BETA_updateModelProvider(options: ModelProviderOptions): Promise<void>
}
