// import { getAccessToken } from "./access-token"

export const callAPI = async (uri: string, opts: RequestInit) =>
  fetch(`${process.env.PLASMO_PUBLIC_API_URI}${uri}`, {
    method: "GET",
    // TODO auth
    // headers: {
    //   Authorization: `Bearer ${await getAccessToken()}`
    // },
    ...opts
  }).then((res) => res.json())