import { modelCallers } from "~core/llm"
import { ErrorCode } from "~public-interface"

import { type Config, configManager } from "./managers/config"
import type { Transaction } from "./managers/transaction"
import type { Result } from "./utils/result-monad"
import { err, ok } from "./utils/result-monad"
import { log } from "./utils/utils"

export type Request = Pick<Required<Transaction>, "model"> &
  Pick<
    Transaction,
    "input" | "temperature" | "maxTokens" | "stopSequences" | "numOutputs"
  > & {
    apiKey?: string
    modelUrl?: string
  }

export async function complete(
  txn: Transaction
): Promise<Result<string[], string>> {
  const config = await configManager.getWithDefault(txn.model)
  const caller = modelCallers[config.id]

  try {
    const result = await caller.complete(txn.input, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: txn.model || config.id,
      max_tokens: txn.maxTokens,
      temperature: txn.temperature,
      stop_sequences: txn.stopSequences,
      num_generations: txn.numOutputs
    })
    return ok(result)
  } catch (error) {
    return err(`${error}`)
  }
}

export function isStreamable(config: Config): boolean {
  return modelCallers[config.id].config.isStreamable
}

export async function stream(
  txn: Transaction
): Promise<AsyncGenerator<Result<string, string>>> {
  try {
    const config = await configManager.getWithDefault(txn.model)
    const caller = modelCallers[config.id]

    if (!isStreamable(config)) {
      throw ErrorCode.InvalidRequest
    }

    if (txn.numOutputs && txn.numOutputs > 1) {
      // Can't stream multiple outputs
      throw ErrorCode.InvalidRequest
    }

    const stream = await caller.stream(txn.input, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: txn.model || config.id,
      max_tokens: txn.maxTokens,
      temperature: txn.temperature,
      stop_sequences: txn.stopSequences
    })
    return readableStreamToGenerator(stream)
  } catch (error) {
    async function* generator() {
      yield err(`${error}`)
    }
    return generator()
  }
}

async function* readableStreamToGenerator(
  stream: ReadableStream<string>
): AsyncGenerator<Result<string, string>> {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let lastValue: string | undefined = undefined
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      lastValue =
        typeof value === "string" // True for browser (always true for local), false for Node.js
          ? value
          : decoder.decode(value, { stream: true })
      log("Got stream value: ", lastValue)
      yield ok(lastValue)
    }
  } catch (error) {
    console.error("Streaming error: ", error, lastValue)
    throw error
  } finally {
    reader.releaseLock()
  }
}
