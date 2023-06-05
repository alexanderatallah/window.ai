import React, { useRef, useState } from "react"

import { NoActivity } from "~core/components/NoActivity"
import { useInfiniteScroll } from "~core/components/hooks/useInfiniteScroll"
import { Logo } from "~core/components/pure/Logo"
import { Skeleton } from "~core/components/pure/Skeleton"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { Text } from "~core/components/pure/Text"
import type { Transaction } from "~core/managers/transaction"
import { transactionManager } from "~core/managers/transaction"

import { ActivityItem } from "./ActivityItem"

export function Activity() {
  const [selectedTxn, selectTxn] = useState<Transaction | undefined>()
  const { objects, loading, appendNextPage } = transactionManager.useObjects(7)

  const loaderRef = useRef<HTMLDivElement>(null)

  useInfiniteScroll(loaderRef, appendNextPage, objects.length > 0)

  return (
    <div>
      {objects.map((txn: Transaction) => (
        <ActivityRow
          key={txn.id}
          transaction={txn}
          onSelect={() => selectTxn(txn)}
        />
      ))}

      {objects.length === 0 && !loading && <NoActivity />}

      <div ref={loaderRef}>{loading && <Skeleton />}</div>

      <SlidingPane shown={!!selectedTxn} onHide={() => selectTxn(undefined)}>
        {selectedTxn && <ActivityItem transaction={selectedTxn} />}
      </SlidingPane>
    </div>
  )
}

function ActivityRow({
  transaction,
  onSelect
}: {
  transaction: Transaction
  onSelect: () => void
}) {
  const input = transactionManager.formatInput(transaction)
  const output = transactionManager.formatOutput(transaction)
  const model = transactionManager.getRoutedModel(transaction)
  return (
    <div
      className={`p-2 h-[4.5rem] grid grid-cols-7 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700`}
      onClick={onSelect}>
      <Logo
        className="self-start mx-2 my-1 w-5 rounded-full"
        faviconFor={transaction.origin.domain}
      />
      <div className="col-span-6 relative">
        <div className="flex flex-row">
          <div className="truncate flex-1">
            <Text truncate>{input}</Text>
          </div>
          {model && (
            <div className="uppercase text-[10px] font-bold bg-slate-300 dark:bg-slate-900 py-0 px-2 rounded-md">
              {model}
            </div>
          )}
        </div>
        <Text lines={2} size="xs" dimming="less">
          {output === undefined ? (
            <span className="italic">No response</span>
          ) : (
            output
          )}
        </Text>
      </div>
    </div>
  )
}
