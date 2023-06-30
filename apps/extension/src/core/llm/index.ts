import { ModelID } from "window.ai"

import { init as initCohere } from "./cohere"
import { init as initLocal } from "./local"
import { Model } from "./model"
import { init as initOpenAI } from "./openai"
import { init as initOpenRouter } from "./openrouter"
import { init as initTogether } from "./together"

// TODO configure basic in-memory lru cache
// const cache = new Map<string, { completion: string }>()
// const cacheGet: CacheGetter = async (key) => cache.get(key)?.completion
// const cacheSet: CacheSetter = async (data) => cache.set(data.id, data)

const DEFAULT_MAX_TOKENS = 256
const shouldDebugModels = process.env.NODE_ENV !== "production"

export enum ModelProvider {
  OpenAI = "openai",
  Cohere = "cohere",
  Together = "together",
  Local = "local",
  OpenRouter = "openrouter"
}

export const local = initLocal(
  {
    debug: shouldDebugModels,
    identifier: ModelProvider.Local
  },
  {
    // TODO consider switching from axios to fetch, since fetchAdapter
    // doesn't work in Node.js side
    max_tokens: 512
  }
)

export const openrouter = initOpenRouter(
  {
    debug: shouldDebugModels,
    identifier: ModelProvider.OpenRouter
  },
  {}
)

export const openaiDirect = initOpenAI(
  {
    debug: shouldDebugModels,
    identifier: ModelProvider.OpenAI
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    presence_penalty: 0 // Using negative numbers causes 500s from davinci
  }
)

export const togetherDirect = initTogether(
  {
    debug: shouldDebugModels,
    identifier: ModelProvider.Together
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.8
  }
)

export const cohereDirect = initCohere(
  {
    debug: shouldDebugModels,
    identifier: ModelProvider.Cohere
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.9
  }
)

export function getCaller(
  model?: ModelID,
  shouldPreferDirect?: boolean
): Model {
  switch (model) {
    case ModelID.Cohere:
      return cohereDirect
    case ModelID.Together:
      return togetherDirect
    case ModelID.GPT_3:
    case ModelID.GPT_3_16k:
    case ModelID.GPT_4:
    case ModelID.GPT_4_32k:
      // Use OpenRouter unless user overrode baseUrl
      return shouldPreferDirect ? openaiDirect : openrouter
    case ModelID.Claude_Instant_V1:
    case ModelID.Claude_Instant_V1_100k:
    case ModelID.Claude_V1:
    case ModelID.Claude_V1_100k:
    case ModelID.Palm_Chat_Bison:
    case ModelID.Palm_Code_Chat_Bison:
    case ModelID.Shap_e:
      return openrouter
    case undefined:
      return shouldPreferDirect ? local : openrouter
  }
}
