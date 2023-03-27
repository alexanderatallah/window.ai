import { v4 as uuidv4 } from "uuid"

import { BaseManager } from "./base"
import { Origin, originManager } from "./origin"

export interface Transaction {
  id: string
  timestamp: number
  prompt: string
  origin: Origin
  completion?: string
  error?: string
}

const originIndexName = "byOrigin"

class TransactionsManager extends BaseManager<Transaction> {
  constructor() {
    super("transactions")
  }

  init(prompt: string, origin: Origin): Transaction {
    return {
      id: uuidv4(),
      origin,
      timestamp: Date.now(),
      prompt
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
}

export const transactionManager = new TransactionsManager()
