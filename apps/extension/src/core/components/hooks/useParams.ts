import { useEffect, useState } from "react"
import type { RequestID } from "window.ai"

import { RequestInterruptType, isRequestInterruptType } from "~core/constants"

export function useParams() {
  const [requestId, setRequestId] = useState<RequestID>()
  const [requestInterruptType, setRequestInterruptType] =
    useState<RequestInterruptType>()

  useEffect(() => {
    if (window.location.search) {
      const urlParams = new URLSearchParams(window.location.search)

      const reqId = urlParams.get("requestId")
      if (reqId) {
        setRequestId(reqId)
      }

      const requestInterruptType = urlParams.get("requestInterruptType")
      if (
        requestInterruptType &&
        isRequestInterruptType(requestInterruptType)
      ) {
        setRequestInterruptType(requestInterruptType)
      }
    }
  }, [])

  return { requestId, requestInterruptType }
}
