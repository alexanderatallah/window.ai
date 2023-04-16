import type { ChatMessage } from "~public-interface"
import { ModelID } from "~public-interface"

import type { ModelConfig, RequestOptions } from "../base/model-api"
import { ModelAPI } from "../base/model-api"

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
  modelId: ModelID,
  config: Pick<ModelConfig, "debug"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">>,
  opts: RequestOptions
) {
  const mapping: { [k: string]: OpenAIModelId } = {
    [ModelID.GPT3]: OpenAIModelId.GPT3_5_Turbo,
    [ModelID.GPT4]: OpenAIModelId.GPT4
  }
  const chatModelId = mapping[modelId]
  if (!chatModelId) {
    throw new Error(`Invalid modelId: ${modelId}`)
  }
  return new ModelAPI(
    {
      modelProvider: "openai",
      isStreamable: true,
      getModelId: (req) => chatModelId,
      baseUrl: "https://api.openai.com/v1",
      getPath: (req) => "/chat/completions",
      debug: config.debug,
      endOfStreamSentinel: "[DONE]",
      cacheGet: config.cacheGet,
      cacheSet: config.cacheSet,
      transformForRequest: (req, meta) => {
        const {
          model,
          stop_sequences,
          num_generations,
          modelProvider,
          prompt,
          ...optsToSend
        } = req
        let messages = optsToSend.messages || []
        if (prompt) {
          messages = [
            ...messages,
            {
              role: "user",
              content: prompt
            }
          ]
        }
        return {
          ...optsToSend,
          messages,
          model,
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
        // We default to "" since the "assistant" role is initially sent
        // with no content
        return messages.map((m) => m.content || "")
      }
    },
    opts
  )
}
