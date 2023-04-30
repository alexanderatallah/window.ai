import { useEffect, useState } from "react"

import { usePort } from "@plasmohq/messaging/hook"

import type { PortRequest, PortResponse } from "~core/constants"
import { PortName } from "~core/constants"

export function usePermissionPort() {
  const { data, send } = usePort<
    PortRequest[PortName.Permission],
    PortResponse[PortName.Permission]
  >(PortName.Permission)
  const [requestId, setRequestId] = useState<string>()

  useEffect(() => {
    // Read the request ID from the URL
    if (window.location.search) {
      const urlParams = new URLSearchParams(window.location.search)
      const requestId = urlParams.get("requestId")
      if (requestId) {
        setRequestId(requestId)
      }
    }
  }, [])

  useEffect(() => {
    // Send the request ID to the extension when it changes
    if (requestId) {
      send({ request: { requesterId: requestId } })
    }
  }, [requestId])

  return { data, send, requestId, setRequestId }
}
