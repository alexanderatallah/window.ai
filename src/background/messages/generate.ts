import type { PlasmoMessaging } from "@plasmohq/messaging/dist"
import { callAPI } from "~core/network"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req)

  const result = await callAPI(
    "/api/model/call",
    {
      method: "POST"
    },
    {
      prompt: req.body.prompt
    }
  ) as { completion: string }

  res.send(result)
}

export default handler