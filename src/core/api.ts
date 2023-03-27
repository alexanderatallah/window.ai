import fetchAdapter from "@vespaiach/axios-fetch-adapter"
import axios from "axios"

import type { Response } from "~pages/api/_common"

import { getAccessToken } from "./access-token"
import { log, parseDataChunks } from "./utils"

const api = axios.create({
  baseURL: process.env.PLASMO_PUBLIC_API_URI,
  headers: {
    "Content-Type": "application/json"
  },
  // TODO move this into the default model axios code
  adapter: fetchAdapter
})

export async function get(path: string, params?: object): Promise<Response> {
  const res = await api.get<Response>(path, {
    params,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`
    }
  })
  return res.data
}
export async function post(path: string, data?: object): Promise<Response> {
  const res = await api.post<Response>(path, data, {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`
    }
  })
  return res.data
}

export async function stream(
  path: string,
  data?: object
): Promise<AsyncGenerator<Response>> {
  const res = await api.post<ReadableStream>(path, data, {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`
    },
    responseType: "stream"
  })

  return readableStreamToGenerator<Response>(res.data)
}

async function* readableStreamToGenerator<T>(stream: ReadableStream) {
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
