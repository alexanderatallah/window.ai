import { useEffect, useState } from "react"

import { usePort } from "@plasmohq/messaging/hook"

import {
  type PortRequest,
  type PortResponse,
  RequestInterruptType
} from "~core/constants"
import { PortName } from "~core/constants"

import { useParams } from "./useParams"

export function usePermissionPort() {
  const { requestId } = useParams()
  const { data, send } = usePort<
    PortRequest[PortName.Permission],
    PortResponse[PortName.Permission]
  >(PortName.Permission)

  useEffect(() => {
    // Send the request ID to the extension when it changes
    if (requestId) {
      send({ request: { requesterId: requestId } })
    }
  }, [requestId])

  return { data, send, requestId: requestId }
}
