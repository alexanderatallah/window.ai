import type { NextApiRequest, NextApiResponse } from "next"

import { getSubsciption, getUserInfo, isAdmin } from "./_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "GET") {
      throw new Error("Invalid request method")
    }

    const userInfo = await getUserInfo(req.headers.authorization)

    let active = false
    if (isAdmin(userInfo.email)) {
      active = true
    } else {
      const subscription = await getSubsciption(userInfo.email)
      active = subscription?.status === "active"
    }

    return res.status(200).json({ active })
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message })
  }
}
