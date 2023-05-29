import type { PlasmoCSConfig } from "plasmo"

import type { PortResponse } from "~core/constants"
import { ContentMessageType, PortName } from "~core/constants"
import type { Port } from "~core/extension"
import { Extension } from "~core/extension"
import { log } from "~core/utils/utils"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

const ports: Record<PortName, Port | undefined> = {
  [PortName.Completion]: undefined,
  [PortName.Generation]: undefined,
  [PortName.Model]: undefined,
  [PortName.Events]: undefined,
  [PortName.Permission]: undefined,
}

function connectWithRetry(portName: PortName): Port {
  log(`Connecting to ${portName} port`)
  const port = Extension.connectToBackground(portName, () =>
    connectWithRetry(portName)
  )
  ports[portName] = port
  return port
}

;(Object.keys(ports) as PortName[]).forEach((portName) => {
  if (portName === PortName.Permission) {
    // Only used for background script
    return
  }
  const port = connectWithRetry(portName)
  // Handle responses from background script
  Extension.addPortListener<typeof portName, PortResponse>((msg) => {
    if (!("response" in msg)) {
      // TODO handle invalid requests
      console.error(`Invalid request`, msg)
      return
    }
    const res = {
      type: ContentMessageType.Response,
      portName,
      id: msg.id,
      response: msg.response
    }
    window.postMessage(res, "*")
  }, port)
})

// Listen to all other incoming messages as events
Extension.addPortListener((msg, port) => {
  if (!("response" in msg)) {
    // TODO handle invalid requests
    console.error(`Invalid request`, msg)
    return
  }
  const res = {
    type: ContentMessageType.Response,
    portName: PortName.Events,
    id: null,
    response: msg.response
  }
  window.postMessage(res, "*")
})

// Handle messages from inpage script
window.addEventListener("message", (event) => {
  const { source, data } = event

  // We only accept messages to our window and a port

  const portName = data.portName as PortName
  const port = ports[portName]
  if (source !== window || !port) {
    return
  }

  const type = data.type as ContentMessageType

  switch (type) {
    case ContentMessageType.Request:
    case ContentMessageType.Cancel:
      log(`Relay received ${type}: `, data)
      Extension.sendMessage(data, port)
      break
    case ContentMessageType.Response:
      // Handled by inpage script
      break
  }
})
