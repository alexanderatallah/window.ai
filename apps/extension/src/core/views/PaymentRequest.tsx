import { CreditCardIcon, LockClosedIcon } from "@heroicons/react/24/solid"
import { useEffect } from "react"

import { Button } from "~core/components/pure/Button"
import { Text } from "~core/components/pure/Text"
import type { PortResponse } from "~core/constants"
import { PortName } from "~core/constants"
import { configManager } from "~core/managers/config"
import { useConfig } from "~core/providers/config"
import { useNav } from "~core/providers/nav"

export function PaymentRequest({
  data,
  onResult
}: {
  data: PortResponse[PortName.Permission]
  onResult: (response: boolean) => void
}) {
  const { config, setConfig } = useConfig()
  const [transaction, error] =
    "error" in data
      ? [undefined, data.error]
      : [data.requester.transaction, undefined]

  const requestedModel = transaction?.model

  useEffect(() => {
    async function loadConfig() {
      const config = await configManager.forModelWithDefault(requestedModel)
      setConfig(config)
    }
    loadConfig()
  }, [])

  return (
    // TODO figure out why hfull doesn't work
    <div className="flex flex-col h-[92%]">
      <div className="flex-auto flex flex-col overflow-y-auto overflow-x-hidden items-center justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900">
          <CreditCardIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
        </div>
        <div className="mt-4 flex flex-col items-center w-full">
          <Text size="lg" strength="medium">
            Payment Required
          </Text>
          <div className="text-center">
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This model requires more credits.
            </p>
          </div>
          <div className="mt-4">
            <Button
              appearance="primary"
              onClick={() => {
                config &&
                  window.open(
                    config.session?.paymentUrl ??
                      configManager.getExternalConfigURL(config),
                    "_blank"
                  )
                onResult(false)
              }}>
              Add Credits
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
