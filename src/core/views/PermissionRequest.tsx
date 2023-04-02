import { KeyIcon } from "@heroicons/react/24/solid"
import { useEffect, useState } from "react"

import { Accordion } from "~core/components/pure/Accordion"
import { Button } from "~core/components/pure/Button"
import { Text } from "~core/components/pure/Text"
import type { PortName, PortResponse } from "~core/constants"
import { LLMLabels, configManager } from "~core/managers/config"
import { originManager } from "~core/managers/origin"
import { useNav } from "~core/providers/nav"
import type { ModelID } from "~public-interface"

export function PermissionRequest({
  data,
  onResult
}: {
  data: PortResponse[PortName.Permission]
  onResult: (response: boolean) => void
}) {
  const { setSettingsShown } = useNav()
  const requestedModel =
    "error" in data ? undefined : data.request.transaction.model
  const [model, setModel] = useState<ModelID | undefined>(requestedModel)

  useEffect(() => {
    async function checkConfig() {
      const config = requestedModel
        ? await configManager.getOrInit(requestedModel)
        : await configManager.getDefault()
      setModel(config.id)
      if (configManager.isIncomplete(config)) {
        setSettingsShown(true)
      }
    }
    checkConfig()
  }, [requestedModel])

  return (
    // TODO figure out why hfull doesn't work
    <div className="flex flex-col h-[92%]">
      <div className="flex-auto flex flex-col overflow-y-auto overflow-x-hidden items-center justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900">
          <KeyIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
        </div>
        <div className="mt-4 text-center flex flex-col items-center w-full">
          <Text size="lg" strength="medium">
            Permission Request
          </Text>
          {"request" in data ? (
            <>
              <Text dimming="more" size="lg">
                {originManager.originDisplay(data.request.transaction.origin)}
              </Text>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                This app is requesting permission to access{" "}
                {model ? LLMLabels[model] : "your model"}
              </p>
              <Accordion title="View Request">
                <code className="text-xs">
                  {JSON.stringify(data.request.transaction.input, null, 2)}
                </code>
              </Accordion>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Error: {data.error}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mx-4">
        <Button appearance="secondary" onClick={() => onResult(false)}>
          Deny
        </Button>
        <Button appearance="primary" onClick={() => onResult(true)}>
          Allow
        </Button>
      </div>
    </div>
  )
}
