import type { NextApiRequest, NextApiResponse } from "next"
import { Transform, TransformCallback } from "stream"

import { ErrorCode, StreamResponse } from "~core/constants"
import { err, ok } from "~core/utils/result-monad"

import { Request, Response, authenticate, openai } from "../_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  try {
    await authenticate(req)
  } catch (error) {
    console.error("Error authenticating: ", error)
    return res.status(401).json(err(ErrorCode.NotAuthenticated))
  }

  if (typeof req.body.prompt !== "string") {
    throw new Error("Invalid prompt: " + req.body)
  }
  const body = req.body as Request

  const stream = await openai.stream({
    prompt: body.prompt
  })

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Content-Encoding", "none") // Required
  res.setHeader("Connection", "keep-alive")

  stream
    .pipe(
      new Transform({
        transform: (chunk, encoding, callback: TransformCallback) => {
          const data: string = chunk.toString("utf8")
          const result: StreamResponse = ok(data)
          callback(null, "data: " + JSON.stringify(result) + "\n\n")
        }
      })
    )
    .pipe(res)
}
