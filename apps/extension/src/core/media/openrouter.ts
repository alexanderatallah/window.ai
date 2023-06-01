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
      defaultBaseUrl: "http://34.106.214.24:8000",
      getPath: () => "/generation",
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
        console.log({
            ...optsToSend,
            prompt,
            user: meta.user_identifier ?? undefined,
            num_outputs: num_generations,
            num_inference_steps: num_inference_steps,
            extension: extension ?? undefined,
          })
        return {
          ...optsToSend,
          prompt,
          user: meta.user_identifier ?? undefined,
          num_outputs: num_generations,
          num_inference_steps: num_inference_steps,
          extension: extension ?? undefined,
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
