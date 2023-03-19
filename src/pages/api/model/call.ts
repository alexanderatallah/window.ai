import type { NextApiRequest, NextApiResponse } from "next"
import { init as initOpenAI } from '~/core/models/openai'
import { getUserInfo } from "../_common"

const cache = {}

const openai = initOpenAI(process.env.OPENAI_API_KEY, {
  quality: "max",
  debug: process.env.NODE_ENV !== "production",
  cacheGet: async (key) => cache[key]?.completion,
  cacheSet: async (data) => cache[data.id] = data
}, {
  presence_penalty: 0, // Using negative numbers causes 500s from davinci
  stop_sequences: ['\n'],
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {
    if (req.method !== "POST") {
      throw new Error("Invalid request method")
    }
    const userInfo = await getUserInfo(req.headers.authorization)
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message })
  }
  const body = JSON.parse(req.body) as { prompt: unknown }
  // TODO check subscription
  // const subscription = await getSubsciption(userInfo.email)

  // const code = subscription.status
  // if (subscription.status !== "active") {
  //   console.log("No subscription yet")
  // }
  if (typeof body.prompt !== "string") {
    throw new Error("Invalid prompt: " + req.body)
  }

  const completion = await openai.generate({ prompt: body.prompt })
  return res.status(200).json({ success: true, completion })
}