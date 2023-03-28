import fetchAdapter from "@vespaiach/axios-fetch-adapter"
import axios from "axios"

import type { Response } from "~pages/api/_common"

import { getAccessToken } from "./utils/access-token"
import { err, ok } from "./utils/result-monad"
import { log, parseDataChunks } from "./utils/utils"

const api = axios.create({
  baseURL: process.env.PLASMO_PUBLIC_API_URI,
  headers: {
    "Content-Type": "application/json"
  },
  // TODO move this into the default model axios code
  adapter: fetchAdapter
})

export async function get<T = string>(
  path: string,
  params?: object
): Promise<Response<T, string>> {
  try {
    const res = await api.get<Response<T, string>>(path, {
      params,
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`
      }
    })
    return res.data
  } catch (error) {
    return err(`${error}`)
  }
}
export async function post<T = string>(
  path: string,
  data?: object
): Promise<Response<T, string>> {
  try {
    const res = await api.post<Response<T, string>>(path, data, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`
      }
    })
    return res.data
  } catch (error) {
    return err(`${error}`)
  }
}

export async function stream<T = string>(
  path: string,
  data?: object
): Promise<AsyncGenerator<Response<T, string>>> {
  try {
    const res = await api.post<ReadableStream>(path, data, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`
      },
      responseType: "stream"
    })

    return readableStreamToGenerator<Response<T, string>>(res.data)
  } catch (error) {
    async function* generator() {
      yield err(`${error}`)
    }
    return generator()
  }
}

async function* readableStreamToGenerator<T>(stream: ReadableStream) {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let lastValue: string | undefined = undefined
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
    yield err(`${error}`)
  } finally {
    reader.releaseLock()
  }
}
