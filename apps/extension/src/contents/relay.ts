import type { PlasmoCSConfig } from "plasmo"

import type { PortEvent, PortResponse } from "~core/constants"
import { ContentMessageType, PortName } from "~core/constants"
import type { Port } from "~core/extension"
import { Extension } from "~core/extension"
import { log } from "~core/utils/utils"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

const portStates: Record<
  PortName,
  { port?: Port; listener?: (message: PortEvent[PortName], port: Port) => void }
> = {
  [PortName.Completion]: {},
  [PortName.Model]: {},
  [PortName.Events]: {},
  [PortName.Permission]: {}
}

function initPortState(portName: PortName) {
  log(`Connecting to ${portName} port`)
  const portState = portStates[portName]
  const port = Extension.connectToBackground(portName, () =>
    initPortState(portName)
  )
  portState.port = port
  // TODO do we need to remove the old listener from the old port?
  portState.listener = (msg) => {
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
  }
  // Handle responses from background script
  Extension.addPortListener<typeof portName, PortResponse>(
    portState.listener,
    port
  )
}

;(Object.keys(portStates) as PortName[]).forEach((portName) => {
  if (portName === PortName.Permission) {
    // Only used for background script
    return
  }
  initPortState(portName)
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
  const port = portStates[portName].port
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
