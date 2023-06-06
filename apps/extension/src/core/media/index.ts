import { MediaMimeType, ModelID } from "window.ai"

import { init as initOpenRouter } from "./openrouter"

import { MediaModel } from "./model"

// TODO configure basic in-memory lru cache
// const cache = new Map<string, { completion: string }>()
// const cacheGet: CacheGetter = async (key) => cache.get(key)?.completion
// const cacheSet: CacheSetter = async (data) => cache.set(data.id, data)

const shouldDebugModels = process.env.NODE_ENV !== "production"

export enum MediaModelProvider {
  OpenRouter = "openrouter",
}

export const shap_e = initOpenRouter(
    {
      debug: shouldDebugModels,
      identifier: MediaModelProvider.OpenRouter
    },
    {
      mime_type: MediaMimeType.PLY,
    }
  )

export function getMediaCaller(model?: ModelID): MediaModel {
      return shap_e
}