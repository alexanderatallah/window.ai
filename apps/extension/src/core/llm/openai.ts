import { type ChatMessage } from "window.ai"

import type { ModelConfig, RequestOptions } from "./model"
import { Model } from "./model"

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
  config: Pick<ModelConfig, "debug" | "identifier"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">>,
  opts: RequestOptions
): Model {
  return new Model(
    {
      ...config,
      isStreamable: true,
      overrideModelParam: (req) => req.model?.split("/")[1] ?? null,
      defaultBaseUrl: "https://api.openai.com/v1",
      getPath: () => "/chat/completions",
      endOfStreamSentinel: "[DONE]",
      transformForRequest: (req, meta) => {
        const {
          stop_sequences,
          num_generations,
          identifier,
          prompt,
          baseUrl,
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
          user: meta.user_identifier ?? undefined,
          stop: stop_sequences ?? undefined,
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
