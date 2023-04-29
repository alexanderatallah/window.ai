import { type Config, configManager } from "./managers/config"
import type { Transaction } from "./managers/transaction"
import type { Result } from "./utils/result-monad"
import { err, ok } from "./utils/result-monad"
import { log } from "./utils/utils"

export async function generate(
  txn: Transaction
): Promise<AsyncGenerator<Result<string, string>>> {
  const config = await configManager.forModelWithDefault(txn.model)
  const caller = configManager.getCaller(config)
  const model = txn.model || configManager.getCurrentModel(config)

  // TODO allow streaming multiple outputs
  const shouldStream =
    isStreamable(config) && !(txn.numOutputs && txn.numOutputs > 1)

  const opts = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model,
    max_tokens: txn.maxTokens,
    temperature: txn.temperature,
    stop_sequences: txn.stopSequences,
    num_generations: txn.numOutputs
  }

  try {
    if (!shouldStream) {
      const result = await caller.complete(txn.input, opts)
      return arrayToGenerator(result)
    } else {
      const stream = await caller.stream(txn.input, opts)
      return readableStreamToGenerator(stream)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`
    async function* generator() {
      yield err(message)
    }
    return generator()
  }
}

async function* arrayToGenerator<T>(
  array: T[]
): AsyncGenerator<Result<T, string>> {
  for (const item of array) {
    yield ok(item)
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
        typeof value === "string"
          ? value
          : decoder.decode(value, { stream: true }) // only for node.js
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

function isStreamable(config: Config): boolean {
  return configManager.getCaller(config).config.isStreamable
}
