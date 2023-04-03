import { v4 as uuidv4 } from "uuid"

import type {
  CompletionOptions,
  Input,
  ModelID,
  Output
} from "~public-interface"

import { BaseManager } from "./base"
import { OriginData, originManager } from "./origin"

export interface Transaction {
  id: string
  timestamp: number
  origin: OriginData
  input: Input

  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
  model?: ModelID
  numOutputs?: number

  outputs?: Output[]
  error?: string
}

const originIndexName = "byOrigin"

class TransactionManager extends BaseManager<Transaction> {
  constructor() {
    super("transactions")
  }

  init(
    input: Input,
    origin: OriginData,
    options: CompletionOptions
  ): Transaction {
    this._validateInput(input)
    const { temperature, maxTokens, stopSequences, model, numOutputs } = options
    return {
      id: uuidv4(),
      origin,
      timestamp: Date.now(),
      input,
      temperature,
      maxTokens,
      stopSequences,
      model,
      numOutputs
    }
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
      .map((t) => {
        if ("text" in t) {
          return t.text
        }
        return `${t.message.role}: ${t.message.content}`
      })
      .join("\n")
  }

  formatJSON(txn: Transaction): object {
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
      (!("prompt" in input) && !("messages" in input))
    ) {
      throw new Error("Invalid input")
    }
  }
}

export const transactionManager = new TransactionManager()
