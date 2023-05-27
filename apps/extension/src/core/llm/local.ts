import { messagesToPrompt } from "~core/utils/utils"

import type { ModelConfig, RequestOptions } from "./model"
import { Model } from "./model"

// NOTE: Unused
export enum AlpacaModelId {
  GGML_7B = "7B/ggml-model-q4_0.bin",
  GGML_30B = "30B/ggml-model-q4_0.bin"
}

export function init(
  config: Pick<ModelConfig, "debug" | "identifier"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">>,
  opts: RequestOptions
): Model {
  return new Model(
    {
      ...config,
      isStreamable: true,
      defaultBaseUrl: "http://127.0.0.1:8000",
      getPath: () => "/completions",
      getRoutePath: () => "/model",
      transformForRequest: (req) => {
        const { prompt, messages, identifier, ...optsToSend } = req
        const fullPrompt =
          prompt !== undefined
            ? prompt
            : messages
            ? messagesToPrompt(messages)
            : undefined
        return {
          ...optsToSend,
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
