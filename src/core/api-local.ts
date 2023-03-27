import fetchAdapter from "@vespaiach/axios-fetch-adapter"

import type { Response } from "~pages/api/_common"

import type { StreamResponse } from "./constants"
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

export async function post(path: string, data: Request): Promise<Response> {
  const result = await alpacaTurbo.complete({
    prompt: data.prompt
  })
  return { text: result, success: true }
}

export async function stream(
  path: string,
  data: Request
): Promise<AsyncGenerator<Response>> {
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
      yield { text: lastValue, success: true } as Response
    }
  } catch (error) {
    console.error(error, lastValue)
    yield { error: error, success: false } as Response
  } finally {
    reader.releaseLock()
  }
}
