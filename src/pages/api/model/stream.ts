import type { NextApiRequest, NextApiResponse } from "next"
import { Transform, TransformCallback } from "stream";
import type { StreamResponse } from "~core/constants";
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

  const body = req.body as Request
  if (typeof body.prompt !== "string") {
    throw new Error("Invalid prompt: " + req.body)
  }

  const stream = await openai.stream({
    prompt: body.prompt,
  })

  res.setHeader('Content-Type', 'text/event-stream');
  // TODO needed? res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Content-Encoding', 'none'); // Required
  res.setHeader('Connection', 'keep-alive');

  stream.pipe(
    new Transform({
      transform: (chunk, encoding, callback: TransformCallback) => {
        const text: string = chunk.toString('utf8')
        const result: StreamResponse = { text }
        callback(null, 'data: ' + JSON.stringify(result) + '\n\n');
      }
    })
  ).pipe(res);
}
