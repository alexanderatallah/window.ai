import { messagesToPrompt } from "~core/utils/utils"

import type { ModelConfig, RequestOptions } from "../base/model-api"
import { ModelAPI } from "../base/model-api"

export function init(
  config: Pick<ModelConfig, "debug"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">> = {},
  opts: RequestOptions
) {
  return new ModelAPI(
    {
      modelProvider: "local",
      isStreamable: true,
      getModelId: () => null,
      baseUrl: "http://127.0.0.1:8000",
      getPath: () => "/completions",
      debug: config.debug,
      cacheGet: config.cacheGet,
      cacheSet: config.cacheSet,
      transformForRequest: (req) => {
        const { prompt, messages, model, ...optsToSend } = req
        const fullPrompt =
          prompt !== undefined
            ? prompt
            : messages
            ? messagesToPrompt(messages)
            : undefined
        return {
          ...optsToSend,
          model,
          prompt: fullPrompt
        }
      },
      transformResponse: (res) => {
        const anyRes = res as any
        return anyRes["choices"].map((c: any) => c["text"])
      }
    },
    opts
  )
}
