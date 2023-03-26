import { useCallback, useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import { useStorage } from "@plasmohq/storage/hook"

import { localStore } from "~core/storage"

const storageKey = "transactionIds"

export interface Transaction {
  id: string
  timestamp: number
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
  const transactions = (await localStore.get<string[]>(storageKey)) || []

  const isNew = !transactions.includes(txn.id)

  await Promise.all([
    localStore.set(`transaction-${txn.id}`, txn),
    isNew ? localStore.set(storageKey, [txn.id, ...transactions]) : undefined
  ])

  return isNew
}

export async function fetchTransactionsById(
  ids: string[]
): Promise<Transaction[]> {
  return Promise.all(
    ids.map((id) => localStore.get<Transaction>(`transaction-${id}`))
  )
}

export function useTransactions(pageSize = 20) {
  const [page, setPage] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionIds] = useStorage<string[]>(storageKey, (v) =>
    v === undefined ? [] : v
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
