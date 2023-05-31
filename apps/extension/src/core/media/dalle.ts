
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
      defaultBaseUrl: "https://api.openai.com/v1/images",
      getPath: () => "/generations",
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
          n: num_generations,
        //   need to find a standardized way to do this
          size: "256x256"
        //   num_inference_steps: optsToSend.num_inference_steps,
        }
      },
      transformResponse: (res) => {
        const anyRes = res as any
        // returns a list of strings that contains each response.data.data[i].url
        return anyRes["data"].map((g: any) => g["url"])
      }
    },
    opts
  )
}
