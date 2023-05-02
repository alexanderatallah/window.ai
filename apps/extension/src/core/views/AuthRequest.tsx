import { LockClosedIcon } from "@heroicons/react/24/solid"
import { useEffect } from "react"

import { Button } from "~core/components/pure/Button"
import { Text } from "~core/components/pure/Text"
import type { PortResponse } from "~core/constants"
import { PortName } from "~core/constants"
import { configManager } from "~core/managers/config"
import { useConfig } from "~core/providers/config"
import { useNav } from "~core/providers/nav"

export function AuthRequest({
  data,
  onResult
}: {
  data: PortResponse[PortName.Permission]
  onResult: (response: boolean) => void
}) {
  const { config, setConfig } = useConfig()
  const { setSettingsShown } = useNav()
  const [transaction, error] =
    "error" in data
      ? [undefined, data.error]
      : [data.requester.transaction, undefined]

  const requestedModel = transaction?.model

  useEffect(() => {
    async function promptForAuth() {
      // This allows us to prompt the user to authenticate a specific model
      const config = await configManager.forModelWithDefault(requestedModel)
      setConfig(config)
      setSettingsShown(true)
    }
    promptForAuth()
  }, [])

  return (
    // TODO figure out why hfull doesn't work
    <div className="flex flex-col h-[92%]">
      <div className="flex-auto flex flex-col overflow-y-auto overflow-x-hidden items-center justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900">
          <LockClosedIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
        </div>
        <div className="mt-4 flex flex-col items-center w-full">
          <Text size="lg" strength="medium">
            Authentication Request
          </Text>
          <div className="text-center">
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Please retry after signing in to {config?.label}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 mx-4">
        <Button appearance="secondary" onClick={() => onResult(false)}>
          Close
        </Button>
      </div>
    </div>
  )
}
