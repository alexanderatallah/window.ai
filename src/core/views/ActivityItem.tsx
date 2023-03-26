import { Logo } from "~core/components/pure/Logo"
import { originManager } from "~core/managers/origin"
import type { Transaction } from "~core/managers/transaction"
import { formatDate } from "~core/utils"

export function ActivityItem({ transaction }: { transaction: Transaction }) {
  const url = originManager.url(transaction.origin)
  return (
    <div className="pb-8">
      <div className="grid grid-cols-6">
        <Logo
          className="w-6 self-center mr-4"
          faviconFor={transaction.origin.domain}
        />
        <div className="col-span-5">
          <h1 className="text-lg font-bold">{transaction.origin.title}</h1>
          <h3 className="text-sm truncate text-slate-500">
            <a href={url} title={url} target="_blank">
              {url}
            </a>
          </h3>
        </div>
      </div>

      <div className="mt-1 text-xs text-slate-600 leading-loose">
        {formatDate(transaction.timestamp)}
      </div>

      <p className="mt-6">
        <span className="font-bold">Prompt:</span> {transaction.prompt}
      </p>

      <p className="mt-6">
        <span className="font-bold">Response:</span> {transaction.completion}
      </p>
    </div>
  )
}
