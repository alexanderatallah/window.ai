import { usePort as usePlasmoPort } from "@plasmohq/messaging/dist/hook"

import type { PortName } from "~core/constants"

export function usePort<TRequestBody, TResponseBody>(
  portName: PortName
): {
  data: TResponseBody
  send: (payload: TRequestBody) => void
} {
  // @ts-ignore TODO check on newer version of plasmohq/messaging/hook
  return usePlasmoPort<TRequestBody, TResponseBody>(portName)
}
