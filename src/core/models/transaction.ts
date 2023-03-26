import { useCallback, useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

export const store = new Storage({
  area: "local"
})
store.setNamespace("transactions-")

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  ;(window as any)._txnStore = store
}

const idsKey = "ids"
export interface Transaction {
  id: string
  timestamp: number
  // origin: Origin
  prompt: string
  completion?: string
}
export function makeTransaction(prompt: string): Transaction {
  return {
    id: uuidv4(),
    timestamp: Date.now(),
    prompt
  }
}
export async function saveTransaction(txn: Transaction): Promise<boolean> {
  const transactions = (await store.get<string[]>(idsKey)) || []

  const isNew = !transactions.includes(txn.id)

  await Promise.all([
    store.set(txn.id, txn),
    isNew ? store.set(idsKey, [txn.id, ...transactions]) : undefined
  ])

  return isNew
}

export async function fetchTransactionsById(
  ids: string[]
): Promise<Transaction[]> {
  return Promise.all(ids.map((id) => store.get<Transaction>(id)))
}

export function useTransactions(pageSize = 20) {
  const [page, setPage] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionIds] = useStorage<string[]>(
    {
      key: idsKey,
      instance: store
    },
    (v) => (v === undefined ? [] : v)
  )

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      const pageTxnIds = transactionIds.slice(
        pageSize * page,
        pageSize * (page + 1)
      )
      const fetched = await fetchTransactionsById(pageTxnIds)
      setTransactions(fetched)
      setLoading(false)
    }

    fetchTransactions()
  }, [page, transactionIds, pageSize])

  const goToPrevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 0))
  }, [])

  const goToNextPage = useCallback(() => {
    setPage((prev) => prev + 1)
  }, [])

  return {
    loading,
    transactions,
    page,
    goToPrevPage,
    goToNextPage
  }
}
