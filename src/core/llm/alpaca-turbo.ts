import { Model, ModelConfig, RequestOptions } from "./model"

export enum AlpacaModelId {
  GGML_7B = "7B/ggml-model-q4_0.bin",
  GGML_30B = "30B/ggml-model-q4_0.bin"
}

export function init(
  config: Pick<ModelConfig, "quality" | "debug" | "adapter"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">> = {},
  opts: RequestOptions
): Model {
  const modelId =
    config.quality === "max" ? AlpacaModelId.GGML_30B : AlpacaModelId.GGML_7B
  return new Model(
    {
      modelProvider: "alpaca",
      modelId,
      baseUrl: "http://127.0.0.1:8000",
      generationPath: "/completions",
      debug: config.debug,
      cacheGet: config.cacheGet,
      cacheSet: config.cacheSet,
      transformForRequest: (req) => {
        return req
      },
      transformResponse: (res) => {
        const anyRes = res as any
        return anyRes["choices"][0]["text"]
      }
    },
    opts
  )
}
