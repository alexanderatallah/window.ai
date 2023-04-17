import { ModelID } from "~public-interface"

import { init as initCohere } from "./cohere"
import { init as initLocal } from "./local"
import { Model } from "./model"
import { init as initOpenAI } from "./openai"
import { init as initTogether } from "./together"

// TODO configure basic in-memory lru cache
// const cache = new Map<string, { completion: string }>()
// const cacheGet: CacheGetter = async (key) => cache.get(key)?.completion
// const cacheSet: CacheSetter = async (data) => cache.set(data.id, data)

const DEFAULT_MAX_TOKENS = 256
const shouldDebugModels = process.env.NODE_ENV !== "production"

export const local = initLocal(
  {
    debug: shouldDebugModels
  },
  {
    // TODO consider switching from axios to fetch, since fetchAdapter
    // doesn't work in Node.js side
    max_tokens: 512
  }
)

export const openai = initOpenAI(
  {
    debug: shouldDebugModels
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    presence_penalty: 0 // Using negative numbers causes 500s from davinci
  }
)

export const together = initTogether(
  {
    debug: shouldDebugModels
  },
  {
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
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.9
    // stop_sequences: ['\n'],
  }
)

export const modelCallers: { [K in ModelID]: Model } = {
  [ModelID.GPT3]: openai,
  [ModelID.GPT4]: openai,
  [ModelID.Cohere]: cohere,
  [ModelID.Together]: together,
  [ModelID.Local]: local
}
