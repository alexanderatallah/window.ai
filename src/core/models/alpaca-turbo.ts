import { Model, ModelConfig, ModelOptions } from "./model"

export enum AlpacaModelId {
  GGML_7B = "7B/ggml-model-q4_0.bin",
  GGML_30B = "30B/ggml-model-q4_0.bin"
}

export function init(
  config: Pick<ModelConfig, "quality" | "debug"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">> = {},
  opts: ModelOptions = {}
): Model {
  const modelId =
    config.quality === "max" ? AlpacaModelId.GGML_30B : AlpacaModelId.GGML_7B
  return new Model(
    {
      modelProvider: "alpaca",
      modelId,
      apiKey: null,
      baseUrl: "http://127.0.0.1:5000",
      generationPath: "/ask_bot",
      debug: config.debug,
      cacheGet: config.cacheGet,
      cacheSet: config.cacheSet,
      transformForRequest: (req, meta) => {
        const { prompt } = req
        return {
          question: prompt
        }
      },
      transformResponse: (res) => {
        return res as string
      }
    },
    opts
  )
}
