import type { NextApiRequest, NextApiResponse } from "next"

import { getSubsciption } from "../_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      throw new Error("Invalid request method")
    }

    // TODO add auth
    // const userInfo = await getUserInfo(req.headers.authorization)

    const subscription = await getSubsciption(req.query.email as string | undefined)

    if (subscription.status !== "active") {
      // throw new Error(`Subscription is not active`)
      console.log("No subscription yet")
    }

    return res.status(200).json({ success: true, code: "147" })
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message })
  }
}