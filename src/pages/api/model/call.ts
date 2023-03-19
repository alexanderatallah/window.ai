import type { NextApiRequest, NextApiResponse } from "next"

import { getSubsciption, getUserInfo } from "../_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      throw new Error("Invalid request method")
    }

    const userInfo = await getUserInfo(req.headers.authorization)

    // TODO check subscription
    // const subscription = await getSubsciption(userInfo.email)

    // const code = subscription.status
    // if (subscription.status !== "active") {
    //   console.log("No subscription yet")
    // }

    return res.status(200).json({ success: true, code: "success for " + userInfo.email })
  } catch (error) {
    return res.status(401).json({ success: false, code: error.message, error: error.message })
  }
}