import { ModelID } from "window.ai"

import { init as initOpen3D } from "./open3d"
// import { init as initLocal } from "./local"
import { MediaModel } from "./model"
// import { init as initOpenAI } from "./openai"
// import { init as initOpenRouter } from "./openrouter"
// import { init as initTogether } from "./together"

// TODO configure basic in-memory lru cache
// const cache = new Map<string, { completion: string }>()
// const cacheGet: CacheGetter = async (key) => cache.get(key)?.completion
// const cacheSet: CacheSetter = async (data) => cache.set(data.id, data)

const DEFAULT_OBJECT_INFERENCE_STEPS = 32
const shouldDebugModels = process.env.NODE_ENV !== "production"

export enum MediaModelProvider {
  OpenRouter = "openrouter"
}

export const open3d = initOpen3D(
    {
      debug: shouldDebugModels,
      identifier: MediaModelProvider.OpenRouter
    },
    {
      num_inference_steps: DEFAULT_OBJECT_INFERENCE_STEPS
    }
  )

export function getMediaCaller(
  model?: ModelID,
  shouldPreferDirect?: boolean
): MediaModel {
  switch (model) {
    case ModelID.OpenRouter3D:
      return open3d
  }
}
