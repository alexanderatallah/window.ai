import { Logo } from "~core/components/pure/Logo"
import { Text } from "~core/components/pure/Text"
import { originManager } from "~core/managers/origin"
import type { Transaction } from "~core/managers/transaction"
import { formatDate } from "~core/utils/utils"

export function ActivityItem({ transaction }: { transaction: Transaction }) {
  const url = originManager.url(transaction.origin)
  return (
    <div className="pb-8">
      <div className="grid grid-cols-6">
        <Logo
          className="w-7 self-top mr-3 mt-4"
          faviconFor={transaction.origin.domain}
        />
        <div className="col-span-5">
          <Text size="lg" strength="bold">
            {transaction.origin.title}
          </Text>
          <Text dimming="less" truncate>
            <a href={url} title={url} target="_blank">
              {originManager.urlDisplay(transaction.origin)}
            </a>
          </Text>
          <div className="mt-2">
            <Text dimming="more" size="xs" truncate>
              {formatDate(transaction.timestamp)}
            </Text>
          </div>
        </div>
      </div>

      {/* <div className="mt-1 text-xs text-slate-600 leading-loose">
        {formatDate(transaction.timestamp)}
      </div> */}

      <p className="mt-6">
        <span className="font-bold">Prompt:</span> {transaction.prompt}
      </p>

      <p className="mt-4">
        <span className="font-bold">Response:</span> {transaction.completion}
      </p>
    </div>
  )
}
