import { Model, ModelConfig, ModelOptions } from "./model"

export enum TogetherModelId {
  GPT_JT_6B_v1 = "Together-gpt-JT-6B-v1",
  GPT_NEOXT_20B_v1 = "together/gpt-neoxT-20B-chat-latest-HF"
}

export const TogetherModels = {
  [TogetherModelId.GPT_JT_6B_v1]: {
    contextLimit: 2048
  },
  [TogetherModelId.GPT_NEOXT_20B_v1]: {
    contextLimit: 1024 // TODO check this
  }
}

export function init(
  apiKey: string,
  appName: string,
  config: Pick<ModelConfig, "quality" | "debug"> &
    Partial<Pick<ModelConfig, "cacheGet" | "cacheSet">>,
  options: ModelOptions
) {
  const modelId = TogetherModelId.GPT_NEOXT_20B_v1
  return new Model(
    {
      modelProvider: "together",
      apiKey,
      baseUrl: "https://staging.together.xyz/api",
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          modelProvider,
          stop_sequences,
          ...optsToSend
        } = req
        return {
          ...optsToSend,
          model: modelId,
          stop: stop_sequences,
          prompt: "User: " + prompt
        }
      },
      transformResponse: (res) => {
        return res["output"]
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            res["output"]["choices"][0]["text"]
          : null
      }
    },
    options
  )
}
