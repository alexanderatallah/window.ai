import { messagesToPrompt } from "~core/utils/utils"

import type { ModelConfig, RequestOptions } from "./model"
import { Model } from "./model"

export enum TogetherModelId {
  GPT_JT_6B_v1 = "Together-gpt-JT-6B-v1",
  GPT_NEOXT_20B_v1 = "gpt-neoxt-chat-20b-v0.15-hf",
  GPT_NEOXT_20B_v2 = "GPT-NeoXT-Chat-Base-20B-v0.16"
}

// export const TogetherModels = {
//   [TogetherModelId.GPT_JT_6B_v1]: {
//     contextLimit: 2048
//   },
//   [TogetherModelId.GPT_NEOXT_20B_v1]: {
//     contextLimit: 1024 // TODO check this
//   }
// }

export function init(
  config: Pick<ModelConfig, "debug" | "identifier"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">>,
  options: RequestOptions
) {
  return new Model(
    {
      ...config,
      isStreamable: false,
      defaultBaseUrl: "https://api.together.xyz",
      getPath: () => "/inference",
      overrideModelParam: () => TogetherModelId.GPT_NEOXT_20B_v2,
      customHeaders: {
        "User-Agent": "window.ai/1.0"
      },
      transformForRequest: (req) => {
        const {
          prompt,
          messages,
          stop_sequences,
          num_generations,
          identifier,
          frequency_penalty,
          presence_penalty,
          max_tokens,
          temperature,
          top_p,
          stream,
          ...optsToSend
        } = req
        const fullPrompt =
          prompt !== undefined
            ? `<human>: ${prompt}`
            : messages
            ? messagesToPrompt(messages)
            : undefined
        return {
          ...optsToSend,
          max_tokens,
          top_p,
          temperature,
          n: num_generations,
          stop: ["\n<human>", ...(stop_sequences ?? [])],
          prompt: fullPrompt
        }
      },
      transformResponse: (res) => {
        const anyRes = res as any
        return anyRes["output"]
          ? anyRes["output"]["choices"].map((c: any) => c["text"])
          : []
      }
    },
    options
  )
}
