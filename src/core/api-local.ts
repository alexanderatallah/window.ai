import fetchAdapter from "@vespaiach/axios-fetch-adapter"

import type { StreamResponse } from "./constants"
import { init as initAlpacaTurbo } from "./models/alpaca-turbo"
import { log } from "./utils"

export const alpacaTurbo = initAlpacaTurbo(
  {
    quality: "low",
    debug: process.env.NODE_ENV !== "production"
  },
  {
    // TODO consider switching from axios to fetch, since fetchAdapter
    // doesn't work in Node.js side
    adapter: fetchAdapter,
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
export async function stream(
  path: string,
  data: Request
): Promise<AsyncGenerator<StreamResponse>> {
  const stream = await alpacaTurbo.stream({ prompt: data.prompt })

  return readableStreamToGenerator(stream)
}

async function* readableStreamToGenerator(stream: ReadableStream) {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let lastValue: string
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      lastValue =
        typeof value === "string" // True for browser (always true for local), false for Node.js
          ? value
          : decoder.decode(value, { stream: true })
      log("Got stream value: ", lastValue)
      yield { text: lastValue }
    }
  } catch (error) {
    console.error(error, lastValue)
  } finally {
    reader.releaseLock()
  }
}
