import { Model, ModelConfig, ModelOptions } from "./model"

export enum OpenAIModelId {
  Davinci = "text-davinci-003",
  Curie = "text-curie-001"
}

export const OpenAIModels = {
  [OpenAIModelId.Davinci]: { contextLimit: 4000 },
  [OpenAIModelId.Curie]: { contextLimit: 2048 }
}

export function init(
  apiKey: string,
  config: Pick<ModelConfig, "quality" | "debug"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">>,
  opts: ModelOptions
): Model {
  const modelId =
    config.quality === "low" ? OpenAIModelId.Curie : OpenAIModelId.Davinci
  return new Model(
    {
      modelProvider: "openai",
      modelId,
      apiKey,
      baseUrl: "https://api.openai.com/v1",
      generationPath: "/completions",
      tokenLimit: OpenAIModels[modelId].contextLimit,
      debug: config.debug,
      cacheGet: (...args) =>
        config.cacheGet ? config.cacheGet(...args) : Promise.resolve(undefined),
      cacheSet: (...args) =>
        config.cacheSet ? config.cacheSet(...args) : Promise.resolve(undefined),
      transformForRequest: (req, meta) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { modelId, stop_sequences, modelProvider, ...optsToSend } = req
        return {
          ...optsToSend,
          model: modelId,
          user: meta.user_identifier || undefined,
          stop: stop_sequences
        }
      },
      transformResponse: (res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return res["choices"][0]["text"]
      }
    },
    opts
  )
}
