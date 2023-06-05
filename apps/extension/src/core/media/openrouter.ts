import { getExternalConfigURL } from "~core/utils/utils"
import type { MediaModelConfig, RequestOptions } from "./model"
import { MediaModel } from "./model"


export function init(
  config: Pick<MediaModelConfig, "debug" | "identifier"> &
    Partial<Pick<MediaModelConfig, "cacheGet" | "cacheSet">>,
  opts: RequestOptions
): MediaModel {
  return new MediaModel(
    {
      ...config,
      defaultBaseUrl: `${getExternalConfigURL()}/v1/api`,
      getPath: () => "/media/generations",
      transformForRequest: (req, meta) => {
        const {
          mime_type,
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
          mime_type: mime_type ?? undefined,
        }
      },
      transformResponse: (res) => {
        const anyRes = res as any
        return anyRes["uris"].map((g: string) => {
          return {
            uri: g
          }
        })
      }
    },
    opts
  )
}
