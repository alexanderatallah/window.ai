import fetchAdapter from "@vespaiach/axios-fetch-adapter"

import type { CompletionResponse, StreamResponse } from "./constants"
import { init as initAlpacaTurbo } from "./llm/alpaca-turbo"
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

export async function post(
  path: string,
  data: Request
): Promise<CompletionResponse> {
  const result = await alpacaTurbo.complete({
    prompt: data.prompt
  })
  return { text: result }
}

export async function stream(
  path: string,
  data: Request
): Promise<AsyncGenerator<StreamResponse>> {
  const stream = await alpacaTurbo.stream({ prompt: data.prompt })

  // TODO fix typing or consolidate all to browser calls
  return readableStreamToGenerator(stream as ReadableStream)
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
