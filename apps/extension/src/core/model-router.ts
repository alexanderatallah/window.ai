import { ErrorCode, ModelID } from "~public-interface"

import { type Config, configManager } from "./managers/config"
import type { Transaction } from "./managers/transaction"
import type { Result } from "./utils/result-monad"
import { err, ok } from "./utils/result-monad"
import { log } from "./utils/utils"

export async function complete(
  data: Transaction
): Promise<Result<string[], string>> {
  const modelId = data.model
  const config = await configManager.getOrDefault(modelId)
  const { template, params } = configManager.getModelParams(config)

  try {
    const result = await template.complete(data.input, {
      ...params,
      max_tokens: data.maxTokens,
      temperature: data.temperature,
      stop_sequences: data.stopSequences,
      num_generations: data.numOutputs
    })
    return ok(result)
  } catch (error) {
    return err(`${error}`)
  }
}

export function isStreamable(config: Config): boolean {
  const { template } = configManager.getModelParams(config)
  return template.config.isStreamable
}

export async function stream(
  data: Transaction
): Promise<AsyncGenerator<Result<string, string>>> {
  try {
    const modelId = data.model
    const config = await configManager.getOrDefault(modelId)

    if (!isStreamable(config)) {
      throw ErrorCode.InvalidRequest
    }

    const { template, params } = configManager.getModelParams(config)

    if (data.numOutputs && data.numOutputs > 1) {
      // Can't stream multiple outputs
      throw ErrorCode.InvalidRequest
    }

    const stream = await template.stream(data.input, {
      ...params,
      max_tokens: data.maxTokens,
      temperature: data.temperature,
      stop_sequences: data.stopSequences
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
