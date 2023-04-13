import { messagesToPrompt } from "~core/utils/utils"

import { Model, ModelConfig, RequestOptions } from "./model"

export function init(
  modelId: string,
  config: Pick<ModelConfig, "debug"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">> = {},
  opts: RequestOptions
): Model {
  return new Model(
    {
      modelProvider: "local",
      isStreamable: true,
      getModelId: () => modelId,
      baseUrl: "http://127.0.0.1:8000",
      getPath: () => "/completions",
      debug: config.debug,
      cacheGet: config.cacheGet,
      cacheSet: config.cacheSet,
      transformForRequest: (req) => {
        const { prompt, messages, modelId, ...optsToSend } = req
        const fullPrompt =
          prompt !== undefined
            ? prompt
            : messages
            ? messagesToPrompt(messages)
            : undefined
        return {
          ...optsToSend,
          model: modelId,
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
