import { useCallback, useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { log } from "~core/utils/utils"

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
      this.indexBy(obj, null, primaryIndexName)
    ])

    if (warning) {
      console.warn("Encountered warning on save: ", warning)
    }

    return isNew
  }

  // Index an object under a specified key. If key is null, just uses the index name.
  // Returns true if the object was new and added to the index
  // O(<index size>) :(
  async indexBy(
    obj: T,
    key: string | null,
    indexName: string
  ): Promise<boolean> {
    const index = key ? `${indexName}-${key}` : indexName
    const ids = (await this.store.get<string[]>(index)) || []

    const isNew = !ids.includes(obj.id)
    if (isNew) {
      await this.store.set(index, [obj.id, ...ids])
    }

    return isNew
  }

  async fetchById(ids: string[]): Promise<T[]> {
    return Promise.all(ids.map((id) => this.store.get<T>(id)))
  }

  useObjects(pageSize = 20, indexName = primaryIndexName) {
    const [page, setPage] = useState<number>(0)
    const [pageMode, setPageMode] = useState<"paginate" | "append">("append")
    const [loading, setLoading] = useState<boolean>(true)
    const [objects, setObjects] = useState<T[]>([])
    const [itemIds] = useStorage<string[]>(
      {
        key: indexName,
        instance: this.store
      },
      (v) => (v === undefined ? [] : v)
    )

    useEffect(() => {
      const fetcher = async () => {
        setLoading(true)
        const pageTxnIds = itemIds.slice(pageSize * page, pageSize * (page + 1))
        const fetched = await this.fetchById(pageTxnIds)
        const allObjects =
          pageMode === "append" ? [...objects, ...fetched] : fetched
        setObjects(allObjects)
        setLoading(false)
      }

      fetcher()
    }, [page, itemIds, pageSize, pageMode])

    const appendNextPage = useCallback(() => {
      setPageMode("append")
      setPage((prev) => {
        const nextNage = prev + 1
        log("Appending next page", nextNage)
        return nextNage
      })
    }, [])

    const goToPrevPage = useCallback(() => {
      setPageMode("paginate")
      setPage((prev) => Math.max(prev - 1, 0))
    }, [])

    const goToNextPage = useCallback(() => {
      setPageMode("paginate")
      setPage((prev) => prev + 1)
    }, [])

    return {
      loading,
      objects,
      page,
      appendNextPage,
      goToPrevPage,
      goToNextPage
    }
  }
}
