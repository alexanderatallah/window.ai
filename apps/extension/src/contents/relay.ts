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
  [PortName.Media]: {},
  [PortName.Events]: {},
  [PortName.Permission]: {}
}

// Initialize all ports, aside from Permission
;(Object.keys(portStates) as PortName[]).forEach((portName) => {
  if (portName === PortName.Permission) {
    // Only used for background script
    return
  }
  _initPortState(portName)
})

// Listen to all incoming messages as events
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
  _postMessage(res)
})

// Handle messages from inpage script
window.addEventListener("message", (event) => {
  const { source, data } = event

  // We only accept messages to our window and a port

  const portName = data.portName as PortName | undefined
  if (source !== window || !portName) {
    return
  }
  const port = portStates[portName].port
  if (!port) {
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

// Helpers

function _postMessage(msg: {
  type: ContentMessageType
  portName: PortName
  id: string | null
  response: any
}) {
  // log(`Relay sending message: `, msg)
  window.postMessage(msg, "*")
}

function _initPortState(portName: PortName) {
  log(`Connecting to ${portName} port`)
  const portState = portStates[portName]
  const port = Extension.connectToBackground(portName, () =>
    _initPortState(portName)
  )
  if (portState.listener && portState.port) {
    Extension.removePortListener(portState.listener, portState.port)
    delete portState.port
    delete portState.listener
  }
  portState.port = port
  portState.listener = (msg) => {
    if (!("response" in msg)) {
      // TODO handle invalid requests
      console.error(`Invalid request`, msg)
      return
    }
    const res = {
      type: ContentMessageType.Response,
      portName,
      id: msg.id ?? null,
      response: msg.response
    }
    _postMessage(res)
  }
  // Handle responses from background script
  Extension.addPortListener<typeof portName, PortResponse>(
    portState.listener,
    port
  )
}
