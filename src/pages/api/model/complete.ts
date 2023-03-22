import type { NextApiRequest, NextApiResponse } from "next"
import { log } from "~core/utils";
import { authenticate, openai, Request, Response } from "../_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {

  try {
    await authenticate(req);
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message })
  }

  log("Received on API: ", req.body);

  const body = JSON.parse(req.body.data) as Request
  if (typeof body.prompt !== "string") {
    throw new Error("Invalid prompt: " + req.body)
  }

  const completion = await openai.generate({
    prompt: body.prompt,
  })
  return res.status(200).json({ success: true, completion })
}
