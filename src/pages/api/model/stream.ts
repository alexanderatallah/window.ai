import type { NextApiRequest, NextApiResponse } from "next"
import { Transform, TransformCallback } from "stream"

import { ErrorCode } from "~core/constants"
import { LLM } from "~core/managers/config"
import { err, ok } from "~core/utils/result-monad"
import { isReadable } from "~core/utils/utils"

import {
  Request,
  Response,
  authenticate,
  openai,
  streamableModels
} from "../_common"

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

  const modelId = req.body.modelId || LLM.GPT3
  const model = streamableModels[modelId as keyof typeof streamableModels]

  if (!model) {
    return res.status(400).json(err(ErrorCode.InvalidRequest))
  }

  const body = req.body as Request

  const stream = await model.stream(body.input, {
    apiKey: body.apiKey
  })

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Content-Encoding", "none") // Required
  res.setHeader("Connection", "keep-alive")

  if (!isReadable(stream)) {
    throw new Error("Stream is not readable. This must be run in Node.js.")
  }

  stream
    .pipe(
      new Transform({
        transform: (chunk, encoding, callback: TransformCallback) => {
          const data: string = chunk.toString("utf8")
          const result = ok(data)
          callback(null, "data: " + JSON.stringify(result) + "\n\n")
        }
      })
    )
    .pipe(res)
}
