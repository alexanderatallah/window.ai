import { useEffect, useState } from "react"
import React from "react"

import { Skeleton } from "~core/components/pure/Skeleton"
import { Transaction, useTransactions } from "~core/models/transaction"

export function Activity() {
  const { transactions, loading, page, goToPrevPage, goToNextPage } =
    useTransactions()

  useEffect(() => {
    console.info("transactions", transactions)
    console.info("loading", loading)
  }, [transactions, loading])

  return (
    <div>
      <div className="w-80">
        {transactions.map((txn: Transaction) => (
          <div
            className={`p-2 grid grid-cols-7 gap-2 cursor-pointer ${
              // ix === selectedIx ? "bg-slate-800" : ""
              ""
            } hover:bg-slate-300`}
            onClick={() => alert("hi")}>
            <div className="emoji">🧠</div>
            <div className="col-span-6 overflow-hidden">
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
      </div>
    </div>
  )
}
