import { getExternalConfigURL } from "~core/utils/utils"

import type { MediaModelConfig, RequestOptions } from "./model"
import { MediaModel } from "./model"

export function init(
  config: Pick<MediaModelConfig, "debug" | "identifier">,
  opts: RequestOptions
): MediaModel {
  return new MediaModel(
    {
      ...config,
      defaultBaseUrl: `${getExternalConfigURL()}/api/v1`,
      getPath: () => "/media/generations",
      transformForRequest: (req, meta) => {
        const {
          extension,
          num_generations,
          identifier,
          prompt,
          baseUrl,
          num_inference_steps,
          ...optsToSend
        } = req
        return {
          ...optsToSend,
          prompt,
          user: meta.user_identifier ?? undefined,
          num_outputs: num_generations,
          num_inference_steps: num_inference_steps,
          extension: extension ?? undefined
        }
      },
      transformResponse: (res) => {
        const anyRes = res as any
        let result = anyRes["data"]
        if("objects" in result){
          result = result["objects"].map(
            ({ uri, url }: { uri: string; url: string | null }) => {
              return { uri, url }
            }
          )
        }
        else if(Array.isArray(result)){
          result = result.map(
            ({ uri, url }: { uri: string; url: string | null }) => {
              return { uri, url }
            }
          )
        }
        throw new Error("Unexpected response from OpenRouter media model.")
      }
    },
    opts
  )
}
