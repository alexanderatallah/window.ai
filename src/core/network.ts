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
export async function callAPI(path: string, body?: object) {
  api.defaults.headers['Authorization'] = `Bearer ${await getAccessToken()}`
  const res = await api.post(path, {
    data: body ? JSON.stringify(body) : undefined
  })
  return res.data as unknown
}

export async function streamAPI(path: string, body?: object) {
  api.defaults.headers['Authorization'] = `Bearer ${await getAccessToken()}`
  try {
    const res = await api.post(path, {
      data: body ? JSON.stringify(body) : undefined,
      responseType: 'stream'
    })

    return streamCompletion(res.data);

  } catch (error) {
    // TODO error handling cleanup
    if (error.response?.status) {
      console.error(error.response.status, error.message);

      for await (const data of error.response.data) {
        const message = data.toString();

        try {
          const parsed = JSON.parse(message);

          console.error("An error occurred during request: ", parsed);
        } catch (error) {
          console.error("An error occurred during request and parse: ", message);
        }
      }
    }
    throw error;
  }
}

// TODO better typing
async function* chunksToLines(chunksAsync) {
  let previous = "";
  for await (const chunk of chunksAsync) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    previous += bufferChunk;
    let eolIndex;
    while ((eolIndex = previous.indexOf("\n")) >= 0) {
      // line includes the EOL
      const line = previous.slice(0, eolIndex + 1).trimEnd();
      if (line === "data: [DONE]") {
        break;
      }
      if (line.startsWith("data: ")) {
        yield line;
      }
      previous = previous.slice(eolIndex + 1);
    }
  }
}

async function* linesToMessages(linesAsync) {
  for await (const line of linesAsync) {
    const message = line.substring("data :".length);

    yield message;
  }
}

async function* streamCompletion(data) {
  yield* linesToMessages(chunksToLines(data));
}