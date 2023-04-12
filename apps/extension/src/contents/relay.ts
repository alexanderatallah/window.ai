import type { PlasmoCSConfig } from "plasmo"

import {
  ContentMessageType,
  PortName,
  PortRequest,
  PortResponse,
  RequestId
} from "~core/constants"
import { Extension, type Port } from "~core/extension"
import { log } from "~core/utils/utils"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

type PublicPort = PortName.Completion | PortName.Model | PortName.Events

const ports: Record<PublicPort, Port> = {
  [PortName.Completion]: Extension.connectToPort(PortName.Completion, () =>
    reconnect(PortName.Completion)
  ),
  [PortName.Model]: Extension.connectToPort(PortName.Model, () =>
    reconnect(PortName.Completion)
  ),
  [PortName.Events]: Extension.connectToPort(PortName.Events, () =>
    reconnect(PortName.Events)
  )
}

function reconnect(portName: PublicPort) {
  log(`Reconnecting to ${portName} port`)
  ports[portName] = Extension.connectToPort(portName, () => reconnect(portName))
}

;(Object.keys(ports) as PublicPort[]).forEach((portName) =>
  // Handle responses from background script
  Extension.addPortListener<typeof portName, PortResponse>(
    portName,
    (msg) => {
      if (!("response" in msg)) {
        // TODO handle invalid requests
        throw `Invalid request: ${msg}`
      }
      const response = msg.response
      const id = "id" in msg ? msg.id : null
      const res = {
        type: ContentMessageType.Response,
        portName,
        id,
        response
      }
      window.postMessage(res, "*")
    },
    ports[portName]
  )
)

// Handle requests from content script
window.addEventListener("message", (event) => {
  const { source, data } = event

  // We only accept messages to our window and a port

  const portName = data.portName as PublicPort
  if (source !== window || !ports[portName]) {
    return
  }

  const type = data.type as ContentMessageType

  switch (type) {
    case ContentMessageType.Request:
    case ContentMessageType.Cancel:
      log(`Relay received ${type}: `, data)
      Extension.sendMessage(data, ports[portName])
      break
    case ContentMessageType.Response:
      // Handled by inpage script
      break
  }
})
