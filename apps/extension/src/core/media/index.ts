import { ModelID } from "window.ai"

import { init as initOpen3D } from "./three-d-objects/openrouter-three-d"

import { ObjectGenerationModel } from "./three-d-objects/model"

// TODO configure basic in-memory lru cache
// const cache = new Map<string, { completion: string }>()
// const cacheGet: CacheGetter = async (key) => cache.get(key)?.completion
// const cacheSet: CacheSetter = async (data) => cache.set(data.id, data)

const DEFAULT_OBJECT_INFERENCE_STEPS = 32
const shouldDebugModels = process.env.NODE_ENV !== "production"

export enum ObjectGenerationModelProvider {
  OpenRouter = "openrouter",
}

export const open3d = initOpen3D(
    {
      debug: shouldDebugModels,
      identifier: ObjectGenerationModelProvider.OpenRouter
    },
    {
      num_inference_steps: DEFAULT_OBJECT_INFERENCE_STEPS
    }
  )

export function getMediaGenerationCaller(
  model?: ModelID,
  shouldPreferDirect?: boolean
): ObjectGenerationModel {
  switch (model) {
    case ModelID.OpenRouter3D:
      return open3d
    default:
      return open3d
  }
}
