import { KeyIcon } from "@heroicons/react/24/solid"
import { useEffect } from "react"

import { Accordion } from "~core/components/pure/Accordion"
import { Button } from "~core/components/pure/Button"
import { Dropdown } from "~core/components/pure/Dropdown"
import { Text } from "~core/components/pure/Text"
import type { PortName, PortResponse } from "~core/constants"
import { LLMLabels, configManager } from "~core/managers/config"
import { originManager } from "~core/managers/origin"
import { Transaction, transactionManager } from "~core/managers/transaction"
import { useModel } from "~core/providers/model"
import { useNav } from "~core/providers/nav"

export function PermissionRequest({
  data,
  onResult
}: {
  data: PortResponse[PortName.Permission]
  onResult: (response: boolean) => void
}) {
  const [transaction, error] =
    "error" in data
      ? [undefined, data.error]
      : [data.request.transaction, undefined]

  return (
    // TODO figure out why hfull doesn't work
    <div className="flex flex-col h-[92%]">
      <div className="flex-auto flex flex-col overflow-y-auto overflow-x-hidden items-center justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900">
          <KeyIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
        </div>
        <div className="mt-4 flex flex-col items-center w-full">
          <Text size="lg" strength="medium">
            Permission Request
          </Text>
          {transaction ? (
            <TransactionPermission transaction={transaction} />
          ) : (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Error: {error}
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

function TransactionPermission({ transaction }: { transaction: Transaction }) {
  const { setSettingsShown } = useNav()
  const { modelId, setModelId } = useModel()
  const { object, setObject } = originManager.useObject(transaction.origin.id)
  const requestedModel = transaction.model

  useEffect(() => {
    async function checkConfig() {
      const config = requestedModel
        ? await configManager.getOrInit(requestedModel)
        : await configManager.getDefault()
      setModelId(config.id)
      if (configManager.isIncomplete(config)) {
        setSettingsShown(true)
      }
    }
    checkConfig()
  }, [requestedModel])

  return (
    <div className="flex flex-col items-center text-center">
      <Text dimming="more" size="lg">
        {originManager.originDisplay(transaction.origin)}
      </Text>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        This app is requesting permission to access {LLMLabels[modelId]}
      </p>
      <Accordion title="View Request" centered>
        <code className="block text-left text-xs overflow-y-auto max-h-20 px-4">
          {JSON.stringify(transactionManager.formatJSON(transaction), null, 2)}
        </code>
      </Accordion>
      <Dropdown
        choices={["ask", "allow"]}
        onSelect={async (permission) =>
          setObject({
            ...transaction.origin,
            permissions: permission
          })
        }>
        {object?.permissions === "allow"
          ? "Always allow this site"
          : "Always ask for this site"}
      </Dropdown>
    </div>
  )
}
