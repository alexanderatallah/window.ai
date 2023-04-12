import type { PlasmoMessaging } from "@plasmohq/messaging/dist"

import { EventBus } from "~background/lib/event-bus"
import type { PortName, PortRequest, PortResponse } from "~core/constants"
import { Result, err, ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"
import { ErrorCode, EventType } from "~public-interface"

export type EventRequest<T> = {
  shouldListen?: boolean
  event?: EventType
  data?: T
}
export type EventResponse<T> = Result<{ event: EventType; data: T }, ErrorCode>

const eventBus = new EventBus()

const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Events],
  PortResponse[PortName.Events]
> = async (req, res) => {
  log("Event port received message: ", req)

  if (!req.body) {
    return res.send(err(ErrorCode.InvalidRequest))
  }

  const { request } = req.body

  if (request.shouldListen) {
    if (!req.port) {
      return res.send(err(ErrorCode.InvalidRequest))
    }
    eventBus.addListener(req.port)
    // We're adding a listener, no response needed
    return
  }

  const { event, data } = request
  if (event) {
    eventBus.dispatch(event, data)
    // No response needed
    return
  }
}

export default handler
