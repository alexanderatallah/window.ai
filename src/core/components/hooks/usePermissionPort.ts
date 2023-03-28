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
      if (urlParams.get("requestId")) {
        send({ id: urlParams.get("requestId") })
      }
    }
  }, [])

  return { data, send }
}
