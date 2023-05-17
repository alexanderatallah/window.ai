import { useParams } from "~core/components/hooks/useParams"
import { usePermissionPort } from "~core/components/hooks/usePermissionPort"
import { Spinner } from "~core/components/pure/Spinner"
import { RequestInterruptType } from "~core/constants"
import { AuthRequest } from "~core/views/AuthRequest"
import { PaymentRequest } from "~core/views/PaymentRequest"

import { PermissionRequest } from "./PermissionRequest"

export function RequestInterrupt() {
  const permissionPort = usePermissionPort()
  const { requestInterruptType } = useParams()

  return !permissionPort.data ? (
    <Spinner />
  ) : requestInterruptType === RequestInterruptType.Permission ? (
    <PermissionRequest
      data={permissionPort.data}
      onResult={(permitted) =>
        permissionPort.requestId &&
        permissionPort.send({
          request: {
            permitted,
            requesterId: permissionPort.requestId
          }
        })
      }
    />
  ) : requestInterruptType === RequestInterruptType.Authentication ? (
    <AuthRequest data={permissionPort.data} onResult={() => window.close()} />
  ) : requestInterruptType === RequestInterruptType.Payment ? (
    <PaymentRequest
      data={permissionPort.data}
      onResult={() => window.close()}
    />
  ) : null
}
