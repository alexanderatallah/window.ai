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
      defaultBaseUrl: "https://a74b-34-74-118-245.ngrok-free.app",
      getPath: () => "/generation",
      transformForRequest: (req, meta) => {
        const {
        //   stop_sequences,
          num_generations,
          identifier,
          prompt,
          baseUrl,
          ...optsToSend
        } = req
        return {
          ...optsToSend,
          prompt,
          user: meta.user_identifier ?? undefined,
        //   stop: stop_sequences ?? undefined,
          num_outputs: num_generations,
          num_inference_steps: optsToSend.num_inference_steps,
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
