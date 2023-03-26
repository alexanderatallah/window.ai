import { useCallback, useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

const primaryIndexName = "ids"

interface BaseModel {
  id: string
}
export abstract class BaseManager<T extends BaseModel> {
  protected store: Storage

  constructor(name: string) {
    this.store = new Storage({
      area: "local"
    })
    this.store.setNamespace(`${name}-`)

    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      ;(window as any)["Web41-" + name + "-store"] = this.store
    }
  }

  abstract init(...args: unknown[]): T

  async get(id: string): Promise<T> {
    return this.store.get<T>(id)
  }

  async save(obj: T): Promise<boolean> {
    const [warning, isNew] = await Promise.all([
      this.store.set(obj.id, obj),
      this.index([primaryIndexName], obj.id)
    ])

    if (warning) {
      console.warn("Encountered warning on save: ", warning)
    }

    return isNew
  }

  // Index a value under a joint index name
  // Returns true if the value was new and added to the joint index
  async index<V>(indexNames: string[], value: V): Promise<boolean> {
    const indexName = indexNames.join("-")
    const values = (await this.store.get<V[]>(indexName)) || []

    const isNew = !values.includes(value)
    if (isNew) {
      await this.store.set(indexName, [value, ...values])
    }

    return isNew
  }

  async fetchById(ids: string[]): Promise<T[]> {
    return Promise.all(ids.map((id) => this.store.get<T>(id)))
  }

  useObjects(pageSize = 20, indexNames = [primaryIndexName]) {
    const [page, setPage] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const [objects, setObjects] = useState<T[]>([])
    const [itemIds] = useStorage<string[]>(
      {
        key: indexNames.join("-"),
        instance: this.store
      },
      (v) => (v === undefined ? [] : v)
    )

    useEffect(() => {
      const fetcher = async () => {
        setLoading(true)
        const pageTxnIds = itemIds.slice(pageSize * page, pageSize * (page + 1))
        const fetched = await this.fetchById(pageTxnIds)
        setObjects(fetched)
        setLoading(false)
      }

      fetcher()
    }, [page, itemIds, pageSize])

    const goToPrevPage = useCallback(() => {
      setPage((prev) => Math.max(prev - 1, 0))
    }, [])

    const goToNextPage = useCallback(() => {
      setPage((prev) => prev + 1)
    }, [])

    return {
      loading,
      objects,
      page,
      goToPrevPage,
      goToNextPage
    }
  }
}
