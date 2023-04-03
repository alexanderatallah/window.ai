import type { ChatMessage } from "~public-interface"

import { Model, ModelConfig, RequestOptions } from "./model"

export enum OpenAIModelId {
  Davinci = "text-davinci-003",
  Curie = "text-curie-001",
  Codex = "code-davinci-002",
  GPT3_5_Turbo = "gpt-3.5-turbo",
  GPT4 = "gpt-4"
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
  const completionModelId =
    config.quality === "low" ? OpenAIModelId.Curie : OpenAIModelId.Davinci
  const chatModelId =
    config.quality === "low" ? OpenAIModelId.GPT3_5_Turbo : OpenAIModelId.GPT4
  // config.quality === "low" ? OpenAIModelId.GPT3_5_Turbo : OpenAIModelId.GPT4
  return new Model(
    {
      modelProvider: "openai",
      getModelId: (req) => (req.messages ? chatModelId : completionModelId),
      baseUrl: "https://api.openai.com/v1",
      getPath: (req) =>
        "messages" in req ? "/chat/completions" : "/completions",
      debug: config.debug,
      endOfStreamSentinel: "[DONE]",
      cacheGet: config.cacheGet,
      cacheSet: config.cacheSet,
      transformForRequest: (req, meta) => {
        const {
          modelId,
          stop_sequences,
          num_generations,
          modelProvider,
          ...optsToSend
        } = req
        return {
          ...optsToSend,
          model: modelId,
          user: meta.user_identifier || undefined,
          stop: stop_sequences.length ? stop_sequences : undefined,
          n: num_generations
        }
      },
      transformResponse: (res) => {
        const anyRes = res as any
        if ("text" in anyRes["choices"][0]) {
          return anyRes["choices"].map((c: any) => c["text"])
        }
        const messages: Partial<ChatMessage>[] = anyRes["choices"].map(
          (c: any) => c["delta"] || c["message"]
        )
        return messages.map((m) => m.content)
      }
    },
    opts
  )
}
