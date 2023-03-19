import { getAccessToken } from "./access-token"

export async function callAPI(uri: string, opts: RequestInit) {
  const res = await fetch(`${process.env.PLASMO_PUBLIC_API_URI}${uri}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`
    },
    ...opts
  })
  return res.json()
}