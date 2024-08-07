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
        // TODO: remove this once openrouter endpoint is migrated from returning a "data" param
        const results = "data" in anyRes ? anyRes.data : anyRes
        const generations = Array.isArray(results)
          ? results
          : results.generations
        return generations.map(
          ({ uri, url }: { uri: string; url: string | null }) => {
            return { uri, url }
          }
        )
      }
    },
    opts
  )
}
