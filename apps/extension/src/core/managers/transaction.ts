import { v4 as uuidv4 } from "uuid"
import {
  type CompletionOptions,
  type InferredOutput,
  type Input,
  type ModelID,
  type MediaOutput,
  isMessagesInput,
  isPromptInput,
  isTextOutput,
  isMediaOutput,
  MediaType,
  type MediaOptions
} from "window.ai"

import { BaseManager } from "./base"
import { configManager } from "./config"
import type { OriginData } from "./origin"
import { originManager } from "./origin"

// export interface MediaOptions<TModel, TInput extends Input = Input> {
//   // The type of media to generate.
//   type?: MediaType
//   // How many completion choices to attempt to generate. Defaults to 1. If the
//   // model doesn't support more than one, then an array with a single element will be returned.
//   numOutputs?: number
//   // How many completion choices to attempt to generate. Defaults to 1. If the
//   // model doesn't support more than one, then an array with a single element will be returned.
//   numInferenceSteps?: number
// }

export interface Transaction<TInput = Input> {
  id: string
  timestamp: number
  origin: OriginData
  input: Input
  numOutputs: number

  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
  model?: ModelID | string
  routedModel?: ModelID | string

  type?: MediaType
  numInferenceSteps?:number


  outputs?: InferredOutput<TInput>[] | MediaOutput
  error?: string
}

const originIndexName = "byOrigin"

class TransactionManager extends BaseManager<Transaction> {
  constructor() {
    super("transactions")
  }

  init<TInput extends Input>(
    input: TInput,
    origin: OriginData,
    options: CompletionOptions<ModelID | string, TInput> & MediaOptions<ModelID | string, TInput>
  ): Transaction {
    this._validateInput(input)
  
    // Extracting parameters common to both CompletionOptions and MediaOptions
    const {
      model,
      numOutputs = 1,
    } = options
  
    // Extracting parameters specific to CompletionOptions
    const {
      temperature,
      maxTokens,
      stopSequences
    } = options as CompletionOptions<ModelID | string, TInput>
  
    // Extracting parameters specific to MediaOptions
    const {
      type,
      numInferenceSteps
    } = options as MediaOptions<ModelID | string, TInput>
  
    return {
      id: uuidv4(),
      origin,
      timestamp: Date.now(),
      input,
      model,
      numOutputs,
      temperature, // may be undefined
      maxTokens, // may be undefined
      stopSequences, // may be undefined
      type, // may be undefined
      numInferenceSteps // may be undefined
    }
  }
  
  

  // Override to set numOutputs on old data
  async _batchFetch(ids: string[]): Promise<Transaction[]> {
    return Promise.all(
      ids.map(async (id) => {
        const raw = await this.store.get<Transaction>(id)
        if (raw.numOutputs === undefined) {
          raw.numOutputs = 1
        }
        return raw
      })
    )
  }

  async save(txn: Transaction): Promise<boolean> {
    const isNew = await super.save(txn)

    if (isNew) {
      const originData = txn.origin
      const newOrigin = originManager.init(originData)
      const origin = await originManager.getOrInit(newOrigin.id, newOrigin)
      await Promise.all([
        originManager.save(origin),
        this.indexBy(txn, origin.id, originIndexName)
      ])
    }

    return isNew
  }

  getRoutedModel(txn: Transaction): ModelID | string | undefined {
    // Backward compat: use .model if routedModel undefined
    return txn.routedModel || txn.model
  }

  formatInput(txn: Transaction): string {
    if ("prompt" in txn.input) {
      return txn.input.prompt
    }
    return txn.input.messages.map((m) => `${m.role}: ${m.content}`).join("\n")
  }

  formatOutput(txn: Transaction): string | undefined {
    if (!txn.outputs) {
      return undefined
    }
    return txn.outputs
      .map((t) =>
      isMediaOutput(t) ? t.uris.join("\n") :
        isTextOutput(t) ? t.text : `${t.message.role}: ${t.message.content}`
      )
      .join("\n")
  }

  formatJSON(txn: Transaction) {
    const { input, temperature, maxTokens, stopSequences, model, numOutputs } =
      txn
    return {
      input,
      temperature,
      maxTokens,
      stopSequences,
      model,
      numOutputs
    }
  }

  _validateInput(input: Input): void {
    if (
      typeof input !== "object" ||
      (!isPromptInput(input) && !isMessagesInput(input))
    ) {
      throw new Error("Invalid input")
    }
  }
}

export const transactionManager = new TransactionManager()
