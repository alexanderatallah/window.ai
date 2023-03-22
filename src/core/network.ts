import { getAccessToken } from "./access-token"
import fetchAdapter from '@vespaiach/axios-fetch-adapter';
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.PLASMO_PUBLIC_API_URI,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: fetchAdapter
});

export async function getAPI<T>(path: string, params?: object) {
  const res = await api.get<T>(path, {
    params,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`
    }
  })
  return res.data
}
export async function postAPI<T>(path: string, data?: object) {
  const res = await api.post<T>(path, data, {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`
    }
  })
  return res.data
}

export async function streamAPI<T>(path: string, data?: object): Promise<AsyncGenerator<T>> {
  const res = await api.post<ReadableStream>(path, data, {
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`
    },
    responseType: 'stream'
  })

  return readableStreamToGenerator<T>(res.data)
}

async function* readableStreamToGenerator<T>(stream: ReadableStream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let lastValue;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.warn("Stream ended", lastValue)
        break;
      }
      lastValue = decoder.decode(value, { stream: true });
      console.warn("Got value: ", lastValue)
      const jsonStr = lastValue.split('data: ')[1]?.trim()
      yield JSON.parse(jsonStr) as T;
    }
  } catch (error) {
    console.error(error, lastValue);
  } finally {
    reader.releaseLock();
  }
}
