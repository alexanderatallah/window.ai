import { ErrorCode, type ModelID } from "window.ai"

import type { CompletionRequest } from "./constants"
import { type Config, configManager } from "./managers/config"
import { originManager } from "./managers/origin"
import type { Transaction } from "./managers/transaction"
import { type Result, unknownErr, unwrap } from "./utils/result-monad"
import { ok } from "./utils/result-monad"
import { log } from "./utils/utils"

export const NO_TXN_REFERRER = "__no_txn_origin__"

export async function route(
  config: Config,
  txn?: Transaction,
  shouldStream?: boolean
): Promise<Result<ModelID | string, ErrorCode | string>> {
  const caller = await configManager.getModelCaller(config)

  const input = txn?.input || { prompt: "" }
  try {
    const result = await caller.route(input, {
      stream: shouldStream ?? false,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      origin: txn ? originManager.url(txn.origin) : NO_TXN_REFERRER,
      max_tokens: txn?.maxTokens,
      temperature: txn?.temperature,
      stop_sequences: txn?.stopSequences,
      num_generations: txn?.numOutputs
    })
    return result
  } catch (error) {
    return unknownErr(error)
  }
}

export async function complete(
  config: Config,
  txn: Transaction
): Promise<Result<string[], ErrorCode | string>> {
  const caller = await configManager.getModelCaller(config)
  const model = txn.routedModel

  try {
    const result = await caller.complete(txn.input, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model,
      origin: originManager.url(txn.origin),
      originTitle: txn.origin.title,
      max_tokens: txn.maxTokens,
      temperature: txn.temperature,
      stop_sequences: txn.stopSequences,
      num_generations: txn.numOutputs
    })
    return result
  } catch (error) {
    return unknownErr(error)
  }
}

export async function shouldStream(
  config: Config,
  request: CompletionRequest
): Promise<boolean> {
  const caller = await configManager.getModelCaller(config)
  // TODO allow > 1 numOutputs
  const canStream =
    caller.config.isStreamable && request.transaction.numOutputs === 1
  if (!canStream) {
    return false
  }
  return request.hasStreamHandler
}

export async function stream(
  config: Config,
  txn: Transaction
): Promise<AsyncGenerator<Result<string, ErrorCode | string>>> {
  try {
    const caller = await configManager.getModelCaller(config)
    const model = txn.routedModel

    const stream = await caller.stream(txn.input, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model,
      origin: originManager.url(txn.origin),
      originTitle: txn.origin.title,
      max_tokens: txn.maxTokens,
      temperature: txn.temperature,
      stop_sequences: txn.stopSequences
    })
    return readableStreamToGenerator(unwrap(stream))
  } catch (error) {
    async function* generator() {
      yield unknownErr(error)
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
        typeof value === "string"
          ? value
          : decoder.decode(value, { stream: true }) // only for node.js
      log("Got stream value: ", lastValue)
      yield ok(lastValue)
    }
  } catch (error) {
    console.error("Streaming error: ", error, lastValue)
    yield unknownErr(error)
  } finally {
    reader.releaseLock()
  }
}
