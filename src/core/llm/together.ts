import { Model, ModelConfig, RequestOptions } from "./model"

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
  appName: string,
  config: Pick<ModelConfig, "quality" | "debug"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">>,
  options: RequestOptions
) {
  const modelId =
    config.quality === "max"
      ? TogetherModelId.GPT_NEOXT_20B_v2
      : TogetherModelId.GPT_JT_6B_v1
  return new Model(
    {
      modelProvider: "together",
      baseUrl: "https://api.together.xyz",
      generationPath: "/inference",
      modelId,
      debug: config.debug,
      cacheGet: config.cacheGet,
      cacheSet: config.cacheSet,
      customHeaders: {
        "User-Agent": appName
      },
      transformForRequest: (req) => {
        const {
          modelId,
          prompt,
          modelProvider,
          stop_sequences,
          ...optsToSend
        } = req
        return {
          ...optsToSend,
          model: modelId,
          stop: ["\n<human>", ...stop_sequences],
          prompt: "<human>: " + prompt
        }
      },
      transformResponse: (res) => {
        const anyRes = res as any
        return anyRes["output"] ? anyRes["output"]["choices"][0]["text"] : null
      }
    },
    options
  )
}
