import { useState } from "react"
import React from "react"

import { Logo } from "~core/components/pure/Logo"
import { Skeleton } from "~core/components/pure/Skeleton"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { Transaction, transactionManager } from "~core/managers/transaction"

import { ActivityItem } from "./ActivityItem"

export function Activity() {
  const [selectedTxn, selectTxn] = useState<Transaction | undefined>()
  const { objects, loading, page, goToPrevPage, goToNextPage } =
    transactionManager.useObjects()

  return (
    <div className="relative overflow-y-auto h-full">
      {objects.map((txn: Transaction) => (
        <div
          key={txn.id}
          className={`p-2 grid grid-cols-7 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700`}
          onClick={() => selectTxn(txn)}>
          <Logo
            className="self-center mx-2 w-6 rounded-full"
            faviconFor={txn.origin.domain}
          />
          <div className="col-span-6">
            <div className="overflow-hidden truncate">{txn.prompt}</div>
            <div className="overflow-hidden truncate text-xs text-slate-600 dark:text-slate-500">
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
