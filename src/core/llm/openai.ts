import { Model, ModelConfig, RequestOptions } from "./model"

export enum OpenAIModelId {
  Davinci = "text-davinci-003",
  Curie = "text-curie-001",
  Codex = "code-davinci-002"
}

// export const OpenAIModels = {
//   [OpenAIModelId.Davinci]: { contextLimit: 4000 },
//   [OpenAIModelId.Curie]: { contextLimit: 2048 }
// }

export function init(
  config: Pick<ModelConfig, "quality" | "debug"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">>,
  opts: RequestOptions
): Model {
  const modelId =
    config.quality === "low" ? OpenAIModelId.Curie : OpenAIModelId.Davinci
  return new Model(
    {
      modelProvider: "openai",
      modelId,
      baseUrl: "https://api.openai.com/v1",
      getPath: (req) =>
        "messages" in req ? "/chat/completions" : "/completions",
      debug: config.debug,
      endOfStreamSentinel: "[DONE]",
      cacheGet: config.cacheGet,
      cacheSet: config.cacheSet,
      transformForRequest: (req, meta) => {
        const { modelId, stop_sequences, modelProvider, ...optsToSend } = req
        return {
          ...optsToSend,
          model: modelId,
          user: meta.user_identifier || undefined,
          stop: stop_sequences.length ? stop_sequences : undefined
        }
      },
      transformResponse: (res) => {
        const anyRes = res as any
        return anyRes["choices"][0]["text"]
      }
    },
    opts
  )
}
