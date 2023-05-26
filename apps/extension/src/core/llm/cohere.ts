import { messagesToPrompt } from "~core/utils/utils"

import type { ModelConfig, RequestOptions } from "./model"
import { Model } from "./model"

export enum CohereModelId {
  XlargeNightly = "command-nightly",
  Xlarge = "command",
  Medium = "command-light"
}

// export const CohereModels = {
//   [CohereModelId.XlargeNightly]: {
//     contextLimit: 2048
//   },
//   [CohereModelId.Xlarge]: {
//     contextLimit: 2048
//   },
//   [CohereModelId.Medium]: {
//     contextLimit: 2048
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
      defaultBaseUrl: "https://api.cohere.ai",
      getPath: () => "/generate",
      authPrefix: "BEARER ",
      overrideModelParam: () => CohereModelId.XlargeNightly,
      debug: config.debug,
      customHeaders: {
        "Cohere-Version": "2022-12-06"
      },
      transformForRequest: (req) => {
        const {
          prompt,
          messages,
          top_p,
          stop_sequences,
          identifier,
          num_generations,
          ...optsToSend
        } = req
        const fullPrompt =
          prompt !== undefined
            ? prompt
            : messages
            ? messagesToPrompt(messages)
            : undefined
        return {
          ...optsToSend,
          stop_sequences,
          prompt: fullPrompt,
          p: top_p,
          num_generations
        }
      },
      transformResponse: (res) => {
        const anyRes = res as any
        return anyRes["generations"]
          ? anyRes["generations"].map((g: any) => g["text"])
          : anyRes["text"]
          ? [anyRes["text"]]
          : []
      }
    },
    options
  )
}
