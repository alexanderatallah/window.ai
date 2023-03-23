import fetchAdapter from "@vespaiach/axios-fetch-adapter"
import type { Readable } from "stream"

import { init as initAlpacaTurbo } from "./models/alpaca-turbo"
import { log, parseDataChunks } from "./utils"

export const alpacaTurbo = initAlpacaTurbo(
  {
    quality: "low",
    debug: process.env.NODE_ENV !== "production"
    // TODO local caching
    // cacheGet,
    // cacheSet
  },
  {
    // TODO consider switching from axios to fetch, since fetchAdapter
    // doesn't work in Node.js side
    adapter: fetchAdapter,
    // TODO implement
    max_tokens: 512
  }
)

type Request = { prompt: string }

export async function post<T>(path: string, data: Request) {
  const completion = await alpacaTurbo.complete({
    prompt: data.prompt
  })
  return { success: true, completion }
}

// TODO
export async function stream<T>(
  path: string,
  data: Request
): Promise<AsyncGenerator<T>> {
  const stream = await alpacaTurbo.stream({ prompt: data.prompt })

  return readableStreamToGenerator<T>(stream)
}

async function* readableStreamToGenerator<T>(stream: Readable) {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let lastValue: string
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      lastValue = decoder.decode(value, { stream: true })
      log("Got stream value: ", lastValue)
      for (const data of parseDataChunks(lastValue)) {
        yield JSON.parse(data) as T
      }
    }
  } catch (error) {
    console.error(error, lastValue)
  } finally {
    reader.releaseLock()
  }
}
