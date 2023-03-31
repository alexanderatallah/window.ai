import { BeakerIcon } from "@heroicons/react/24/solid"
import { useRef, useState } from "react"
import React from "react"

import { useInfiniteScroll } from "~core/components/hooks/useInfiniteScroll"
import { Logo } from "~core/components/pure/Logo"
import { Skeleton } from "~core/components/pure/Skeleton"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { Text } from "~core/components/pure/Text"
import { Transaction, transactionManager } from "~core/managers/transaction"

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

      {objects.length === 0 && !loading && (
        <div className="flex flex-col p-8">
          <Text size="lg" align="center" strength="medium">
            No activity yet
          </Text>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Join the{" "}
            <a
              className="dark:text-white"
              href="https://discord.gg/vDAvbuySYv"
              target="_blank">
              Discord
            </a>{" "}
            server to explore window.ai apps.
          </p>
        </div>
      )}

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
  return (
    <div
      className={`p-2 h-[4.5rem] grid grid-cols-7 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700`}
      onClick={onSelect}>
      <Logo
        className="self-start mx-2 my-1 w-5 rounded-full"
        faviconFor={transaction.origin.domain}
      />
      <div className="col-span-6">
        <Text truncate>{transaction.prompt}</Text>
        <Text lines={2} size="xs" dimming="less">
          {transaction.completion === undefined ? (
            <span className="italic">No response</span>
          ) : (
            transaction.completion
          )}
        </Text>
      </div>
    </div>
  )
}
