import fetchAdapter from "@vespaiach/axios-fetch-adapter"

import { init as initAlpacaTurbo } from "~core/llm/alpaca-turbo"
import { init as initCohere } from "~core/llm/cohere"
import { init as initOpenAI } from "~core/llm/openai"
import { init as initTogether } from "~core/llm/together"
import { ErrorCode, ModelID } from "~public-interface"

import type { Model } from "./llm/model"
import type { Transaction } from "./managers/transaction"
import { Result, err, ok } from "./utils/result-monad"
import { log } from "./utils/utils"

// TODO configure basic in-memory lru cache
// const cache = new Map<string, { completion: string }>()
// const cacheGet: CacheGetter = async (key) => cache.get(key)?.completion
// const cacheSet: CacheSetter = async (data) => cache.set(data.id, data)

const DEFAULT_MAX_TOKENS = 256
const shouldDebugModels = process.env.NODE_ENV !== "production"

export type Request = Pick<
  Transaction,
  | "model"
  | "input"
  | "temperature"
  | "maxTokens"
  | "stopSequences"
  | "numOutputs"
> & {
  apiKey?: string
  modelUrl?: string
}

export const alpacaTurbo = initAlpacaTurbo(
  {
    quality: "low",
    debug: shouldDebugModels
  },
  {
    // TODO consider switching from axios to fetch, since fetchAdapter
    // doesn't work in Node.js side
    max_tokens: 512,
    adapter: fetchAdapter
  }
)

export const openai3_5 = initOpenAI(
  {
    quality: "low",
    debug: shouldDebugModels
  },
  {
    adapter: fetchAdapter,
    max_tokens: DEFAULT_MAX_TOKENS,
    presence_penalty: 0 // Using negative numbers causes 500s from davinci
  }
)

export const openai4 = initOpenAI(
  {
    quality: "max",
    debug: shouldDebugModels
  },
  {
    adapter: fetchAdapter,
    max_tokens: DEFAULT_MAX_TOKENS,
    presence_penalty: 0 // Using negative numbers causes 500s from davinci
  }
)

export const together = initTogether(
  "window.ai",
  {
    quality: "max", // TODO this currently 500s
    debug: shouldDebugModels
  },
  {
    adapter: fetchAdapter,
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.8
    // stop_sequences: ['\n'],
  }
)

export const cohere = initCohere(
  {
    quality: "max",
    debug: shouldDebugModels
  },
  {
    adapter: fetchAdapter,
    apiKey: process.env.COHERE_API_KEY,
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.9
    // stop_sequences: ['\n'],
  }
)

const modelInstances: { [K in ModelID]: Model } = {
  [ModelID.GPT3]: openai3_5,
  [ModelID.GPT4]: openai4,
  [ModelID.Cohere]: cohere,
  [ModelID.GPTNeo]: together,
  [ModelID.Local]: alpacaTurbo
}

const streamableModels = new Set([ModelID.GPT3, ModelID.GPT4, ModelID.Local])

export async function complete(
  data: Request
): Promise<Result<string[], string>> {
  const modelId = data.model || ModelID.GPT3
  const model = modelInstances[modelId]

  log("model", modelId, model, data)

  if (!model) {
    return err(ErrorCode.InvalidRequest)
  }

  try {
    const result = await model.complete(data.input, {
      apiKey: data.apiKey,
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

export async function stream(
  data: Request
): Promise<AsyncGenerator<Result<string, string>>> {
  try {
    const modelId = data.model || ModelID.GPT3
    const model = streamableModels.has(modelId) && modelInstances[modelId]

    if (!model) {
      throw ErrorCode.InvalidRequest
    }

    if (data.numOutputs && data.numOutputs > 1) {
      // Can't stream multiple outputs
      throw ErrorCode.InvalidRequest
    }

    const stream = await model.stream(data.input, {
      apiKey: data.apiKey,
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
