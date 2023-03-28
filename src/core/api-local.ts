import fetchAdapter from "@vespaiach/axios-fetch-adapter"

import type { Response } from "~pages/api/_common"

import { init as initAlpacaTurbo } from "./llm/alpaca-turbo"
import { err, ok } from "./utils/result-monad"
import { log } from "./utils/utils"

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
): Promise<Response<string, string>> {
  try {
    const result = await alpacaTurbo.complete({
      prompt: data.prompt
    })
    return ok(result)
  } catch (error) {
    return err(`${error}`)
  }
}

export async function stream(
  path: string,
  data: Request
): Promise<AsyncGenerator<Response<string, string>>> {
  try {
    const stream = await alpacaTurbo.stream({ prompt: data.prompt })

    // TODO fix typing or consolidate all to browser calls
    return readableStreamToGenerator(stream as ReadableStream)
  } catch (error) {
    async function* generator() {
      yield err(`${error}`)
    }
    return generator()
  }
}

async function* readableStreamToGenerator(
  stream: ReadableStream
): AsyncGenerator<Response<string, string>> {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let lastValue: string | undefined = undefined
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
      yield ok(lastValue)
    }
  } catch (error) {
    console.error("Streaming error: ", error, lastValue)
    yield err(`${error}`)
  } finally {
    reader.releaseLock()
  }
}
