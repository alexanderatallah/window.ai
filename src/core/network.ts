import { getAccessToken } from "./access-token"

export async function callAPI(uri: string, opts: RequestInit, body?: object) {
  const res = await fetch(`${process.env.PLASMO_PUBLIC_API_URI}${uri}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`
    },
    body: body ? JSON.stringify(body) : undefined,
    ...opts
  })
  return res.json() as unknown
}