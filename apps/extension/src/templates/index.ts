import { ModelID } from "~public-interface"
import { init as initCohere } from "~templates/api/cohere"
import { init as initLocalAPI } from "~templates/api/local"
import { init as initOpenAI } from "~templates/api/openai"
import { init as initTogether } from "~templates/api/together"

// TODO configure basic in-memory lru cache
// const cache = new Map<string, { completion: string }>()
// const cacheGet: CacheGetter = async (key) => cache.get(key)?.completion
// const cacheSet: CacheSetter = async (data) => cache.set(data.id, data)

const DEFAULT_MAX_TOKENS = 256
const shouldDebugModels = process.env.NODE_ENV !== "production"

const local = initLocalAPI(
  ModelID.Local,
  {
    debug: shouldDebugModels
  },
  {
    // TODO consider switching from axios to fetch, since fetchAdapter
    // doesn't work in Node.js side
    max_tokens: 512
  }
)

const openai = initOpenAI(
  ModelID.GPT3,
  {
    debug: shouldDebugModels
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    presence_penalty: 0 // Using negative numbers causes 500s from davinci
  }
)

const together = initTogether(
  {
    debug: shouldDebugModels
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.8
    // stop_sequences: ['\n'],
  }
)

const cohere = initCohere(
  {
    debug: shouldDebugModels
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.9
    // stop_sequences: ['\n'],
  }
)

export const Templates = {
  OpenAI: openai,
  Together: together,
  Cohere: cohere,
  Local: local
}

export type TemplateID = keyof typeof Templates
