import "./style.css"

import { useEffect } from "react"

import { NavBar } from "~core/components/NavBar"
import { usePort } from "~core/components/hooks/usePort"
import { PortName, PortRequest, PortResponse } from "~core/constants"
import { NavProvider, useNav } from "~core/providers/nav"
import { Activity } from "~core/views/Activity"
import { Apps } from "~core/views/Apps"

function Popup() {
  const port = usePort<
    PortRequest[PortName.Permission],
    PortResponse[PortName.Permission]
  >(PortName.Permission)

  useEffect(() => {
    if (window.location.search) {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("requestId")) {
        port.send({ id: urlParams.get("requestId") })
      }
    }
  }, [])

  return (
    <main
      className={
        "bg-slate-200 dark:bg-slate-800" +
        " text-slate-900 dark:text-slate-200" +
        " md:mx-auto p-0 w-80 h-[32rem]" +
        " text-sm font-sans"
      }>
      {port.data ? (
        <PermissionRequest
          data={port.data}
          send={(permitted) => port.send({ id: port.data.id, permitted })}
        />
      ) : (
        <NavProvider>
          <NavFrame />
        </NavProvider>
      )}
    </main>
  )
}

function PermissionRequest({
  data,
  send
}: {
  data: PortResponse[PortName.Permission]
  send: (response: boolean) => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-auto relative overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900">
              <svg
                className="w-8 h-8 text-slate-900 dark:text-slate-100"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 00-8 8 8 8 0 0016 0 8 8 0 00-8-8zm0 14a6 6 0 110-12 6 6 0 010 12z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M10 6a1 1 0 00-1 1v4a1 1 0 002 0V7a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M10 13a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h1 className="text-lg font-medium">Permission Request</h1>
              {"request" in data ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  This app is requesting permission to access your account:
                  {JSON.stringify(data.request)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Error: {data.error}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center mt-8 space-y-4">
            <button
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              onClick={() => send(true)}>
              Allow
            </button>
            <button
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              onClick={() => send(false)}>
              Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavFrame() {
  const { view } = useNav()
  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-none">
        <NavBar />
      </div>
      <div className="flex-auto relative overflow-y-auto overflow-x-hidden">
        {view === "activity" && <Activity />}
        {view === "apps" && <Apps />}
      </div>
    </div>
  )
}

export default Popup
