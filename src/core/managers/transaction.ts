import { v4 as uuidv4 } from "uuid"

import type { Input, Output } from "~core/constants"

import { BaseManager } from "./base"
import type { LLM } from "./config"
import { Origin, originManager } from "./origin"

export interface Transaction {
  id: string
  timestamp: number
  origin: Origin
  input: Input

  output?: Output
  model?: LLM
  error?: string
}

const originIndexName = "byOrigin"

class TransactionManager extends BaseManager<Transaction> {
  constructor() {
    super("transactions")
  }

  init(input: Input, origin: Origin): Transaction {
    this._validateInput(input)
    return {
      id: uuidv4(),
      origin,
      timestamp: Date.now(),
      input
    }
  }

  async save(txn: Transaction): Promise<boolean> {
    const isNew = await super.save(txn)

    if (isNew && txn.origin) {
      await Promise.all([
        originManager.save(txn.origin),
        this.indexBy(txn, txn.origin.id, originIndexName)
      ])
    }

    return isNew
  }

  formatInput(txn: Transaction): string {
    // TODO deprecated, dev-only data
    if (!("input" in txn)) {
      return (txn as any).prompt
    }
    if ("prompt" in txn.input) {
      return txn.input.prompt
    }
    return txn.input.messages.map((m) => `${m.role}: ${m.content}`).join("\n")
  }

  formatOutput(txn: Transaction): string | undefined {
    // TODO deprecated, dev-only data
    if (!("output" in txn)) {
      return (txn as any).completion
    }
    if (!txn.output) {
      return undefined
    }
    if ("text" in txn.output) {
      return txn.output.text
    }
    const m = txn.output.message
    return `${m.role}: ${m.content}`
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
