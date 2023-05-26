import { type ChatMessage } from "window.ai"

import { getExternalConfigURL } from "~core/utils/utils"

import type { ModelConfig, RequestOptions } from "./model"
import { Model } from "./model"

export function init(
  config: Pick<ModelConfig, "debug" | "identifier"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">>,
  opts: RequestOptions
): Model {
  // Configurable to localhost in extension UI
  return new Model(
    {
      ...config,
      isStreamable: true,
      defaultBaseUrl: `${getExternalConfigURL()}/api/v1`,
      getPath: () => "/chat/completions",
      getRoutePath: () => "/model",
      endOfStreamSentinel: "[DONE]",
      transformForRequest: (req, meta) => {
        const {
          stop_sequences,
          num_generations,
          identifier,
          prompt,
          baseUrl,
          max_tokens,
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
          max_tokens: max_tokens ?? undefined,
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
