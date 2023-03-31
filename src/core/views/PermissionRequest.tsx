import { useEffect } from "react"

import type { PortName, PortResponse } from "~core/constants"
import { configManager } from "~core/managers/config"
import { useNav } from "~core/providers/nav"

export function PermissionRequest({
  data,
  onResult
}: {
  data: PortResponse[PortName.Permission]
  onResult: (response: boolean) => void
}) {
  const { setSettingsShown } = useNav()
  const model = "error" in data ? undefined : data.request.transaction.model

  useEffect(() => {
    async function checkConfig() {
      const config = model
        ? await configManager.getOrInit(model)
        : await configManager.getDefault()

      setSettingsShown(configManager.isIncomplete(config))
    }
    checkConfig()
  }, [model])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-auto overflow-y-auto overflow-x-hidden">
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
              onClick={() => onResult(true)}>
              Allow
            </button>
            <button
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              onClick={() => onResult(false)}>
              Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
