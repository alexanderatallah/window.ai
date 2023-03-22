import type { NextApiRequest, NextApiResponse } from "next"

import { Request, Response, authenticate, openai } from "../_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  try {
    await authenticate(req)
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message })
  }

  const body = req.body as Request
  if (typeof body.prompt !== "string") {
    throw new Error("Invalid prompt: " + req.body)
  }

  const completion = await openai.generate({
    prompt: body.prompt
  })
  return res.status(200).json({ success: true, completion })
}
