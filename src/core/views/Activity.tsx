import { useEffect, useState } from "react"
import React from "react"

import { Skeleton } from "~core/components/pure/Skeleton"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { Transaction, useTransactions } from "~core/models/transaction"

import { ActivityItem } from "./ActivityItem"

export function Activity() {
  const [selectedTxn, selectTxn] = useState<Transaction | undefined>()
  const { transactions, loading, page, goToPrevPage, goToNextPage } =
    useTransactions()

  return (
    <div className="relative overflow-y-auto h-full">
      {transactions.map((txn: Transaction) => (
        <div
          className={`p-2 grid grid-cols-7 cursor-pointer hover:bg-slate-300`}
          onClick={() => selectTxn(txn)}>
          <div className="text-xl px-2 py-1">🧠</div>
          <div className="col-span-6">
            <div className="overflow-hidden truncate">{txn.prompt}</div>
            <div className="overflow-hidden truncate text-xs text-slate-600">
              {txn.completion === undefined ? (
                <span className="italic">No response</span>
              ) : (
                txn.completion
              )}
            </div>
          </div>
        </div>
      ))}

      {loading && <Skeleton />}

      <SlidingPane shown={!!selectedTxn} onHide={() => selectTxn(undefined)}>
        {selectedTxn && <ActivityItem transaction={selectedTxn} />}
      </SlidingPane>
    </div>
  )
}
