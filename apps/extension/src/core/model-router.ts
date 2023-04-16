import fetchAdapter from "@vespaiach/axios-fetch-adapter"

import { ErrorCode, ModelID } from "~public-interface"
import { init as initCohere } from "~templates/cohere"
import { init as initLocalAPI } from "~templates/local"
import { init as initOpenAI } from "~templates/openai"
import { init as initTogether } from "~templates/together"

import type { Model } from "../templates/base/model-api"
import type { Transaction } from "./managers/transaction"
import type { Result } from "./utils/result-monad"
import { err, ok } from "./utils/result-monad"
import { log } from "./utils/utils"

// TODO configure basic in-memory lru cache
// const cache = new Map<string, { completion: string }>()
// const cacheGet: CacheGetter = async (key) => cache.get(key)?.completion
// const cacheSet: CacheSetter = async (data) => cache.set(data.id, data)

const DEFAULT_MAX_TOKENS = 256
const shouldDebugModels = process.env.NODE_ENV !== "production"

export type Request = Pick<Required<Transaction>, "model"> &
  Pick<
    Transaction,
    "input" | "temperature" | "maxTokens" | "stopSequences" | "numOutputs"
  > & {
    apiKey?: string
    modelUrl?: string
  }

export const localModel = initLocalAPI(
  ModelID.Local,
  {
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
  ModelID.GPT3,
  {
    debug: shouldDebugModels
  },
  {
    adapter: fetchAdapter,
    max_tokens: DEFAULT_MAX_TOKENS,
    presence_penalty: 0 // Using negative numbers causes 500s from davinci
  }
)

export const openai4 = initOpenAI(
  ModelID.GPT4,
  {
    debug: shouldDebugModels
  },
  {
    adapter: fetchAdapter,
    max_tokens: DEFAULT_MAX_TOKENS,
    presence_penalty: 0 // Using negative numbers causes 500s from davinci
  }
)

export const together = initTogether(
  {
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
    debug: shouldDebugModels
  },
  {
    adapter: fetchAdapter,
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
  [ModelID.Local]: localModel
}

export async function complete(
  data: Request
): Promise<Result<string[], string>> {
  const modelId = data.model || ModelID.GPT3
  const model = modelInstances[modelId]

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

export function isStreamable(modelId: ModelID): boolean {
  return modelInstances[modelId].config.isStreamable
}

export async function stream(
  data: Request
): Promise<AsyncGenerator<Result<string, string>>> {
  try {
    const modelId = data.model || ModelID.GPT3
    const model = modelInstances[modelId]

    if (!model || !isStreamable(modelId)) {
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
