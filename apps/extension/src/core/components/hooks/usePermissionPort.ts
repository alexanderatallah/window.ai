import { useEffect } from "react"

import { usePort } from "@plasmohq/messaging/hook"

import { PortName, PortRequest, PortResponse } from "~core/constants"

export function usePermissionPort() {
  const { data, send } = usePort<
    PortRequest[PortName.Permission],
    PortResponse[PortName.Permission]
  >(PortName.Permission)

  useEffect(() => {
    if (window.location.search) {
      const urlParams = new URLSearchParams(window.location.search)
      const requestId = urlParams.get("requestId")
      if (requestId) {
        send({ id: requestId })
      }
    }
  }, [])

  return { data, send }
}
