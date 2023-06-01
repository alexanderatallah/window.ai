import type { ObjectGenerationModelConfig, RequestOptions } from "./model"
import { ObjectGenerationModel } from "./model"


export function init(
  config: Pick<ObjectGenerationModelConfig, "debug" | "identifier"> &
    Partial<Pick<ObjectGenerationModelConfig, "cacheGet" | "cacheSet">>,
  opts: RequestOptions
): ObjectGenerationModel {
  return new ObjectGenerationModel(
    {
      ...config,
      defaultBaseUrl: "http://34.106.214.24:8000",
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
