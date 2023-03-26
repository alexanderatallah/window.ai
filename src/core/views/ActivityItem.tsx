import type { Transaction } from "~core/models/transaction"
import { formatDate } from "~core/utils"

export function ActivityItem({ transaction }: { transaction: Transaction }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Site name</h1>
      <h3 className="text-sm text-slate-600">Site URL</h3>

      <div className="">{formatDate(transaction.timestamp)}</div>

      <p>
        <span className="font-bold">Prompt:</span> {transaction.prompt}
      </p>

      <p>
        <span className="font-bold">Response:</span> {transaction.completion}
      </p>
    </div>
  )
}
