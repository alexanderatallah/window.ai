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

  constructor(
    name: string,
    area: "sync" | "local" | "managed" | "session" = "local"
  ) {
    this.store = new Storage({
      area
    })
    this.store.setNamespace(`${name}-`)

    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      ;(window as any)["window.ai-" + name + "-store"] = this.store
    }
  }

  abstract init(...args: unknown[]): T

  async get(id: string): Promise<T | undefined> {
    const batch = await this._batchFetch([id])
    return batch[0]
  }

  async getIds(
    pageSize = 20,
    page = 0,
    indexName?: string,
    indexKey?: string
  ): Promise<string[]> {
    const index = this._getIndex(indexName, indexKey)
    const ids = (await this.store.get<string[]>(index)) || []
    return ids.slice(pageSize * page, pageSize * (page + 1))
  }

  async getOrInit(id: string, ...initArgs: unknown[]): Promise<T> {
    const obj = await this.get(id)
    if (obj) {
      return obj
    }
    if (initArgs.length) {
      return this.init(...initArgs)
    }
    return this.init(id)
  }

  async save(obj: T): Promise<boolean> {
    const [warning, isNew] = await Promise.all([
      this.store.set(obj.id, obj),
      this.indexBy(obj, undefined, primaryIndexName)
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
    key: string | undefined,
    indexName: string
  ): Promise<boolean> {
    const index = this._getIndex(indexName, key)
    const ids = (await this.store.get<string[]>(index)) || []

    const isNew = !ids.includes(obj.id)
    if (isNew) {
      await this.store.set(index, [obj.id, ...ids])
    }

    return isNew
  }

  // Root method for loading from storage
  async _batchFetch(ids: string[]): Promise<T[]> {
    return Promise.all(ids.map((id) => this.store.get<T>(id)))
  }

  useObject(id: string) {
    const [object, setObject] = useStorage<T | undefined>({
      key: id,
      instance: this.store
    })
    return {
      object,
      setObject
    }
  }

  // Note that this doesn't listen to changes of the contents of each object.
  // Just the indexName
  useObjects(pageSize = 20, indexName?: string, indexKey?: string) {
    const [page, _setPage] = useState<number>(0)
    const [_pageMode, _setPageMode] = useState<"paginate" | "append">("append")
    const [loading, _setLoading] = useState<boolean>(true)
    const [objects, _setObjects] = useState<T[]>([])
    const [_itemIds] = useStorage<string[]>(
      {
        key: this._getIndex(indexName, indexKey),
        instance: this.store
      },
      (v) => (v === undefined ? [] : v)
    )

    useEffect(() => {
      const fetcher = async () => {
        _setLoading(true)
        const pageTxnIds = _itemIds.slice(
          pageSize * page,
          pageSize * (page + 1)
        )
        const fetched = await this._batchFetch(pageTxnIds)
        const allObjects =
          _pageMode === "append" ? [...objects, ...fetched] : fetched
        _setObjects(allObjects)
        _setLoading(false)
      }

      fetcher()
      // Adding objects as a dependency causes an infinite loop
    }, [page, _itemIds, pageSize, _pageMode])

    const appendNextPage = useCallback(() => {
      _setPageMode("append")
      _setPage((prev) => {
        const nextNage = prev + 1
        log("Appending next page", nextNage)
        return nextNage
      })
    }, [])

    const goToPrevPage = useCallback(() => {
      _setPageMode("paginate")
      _setPage((prev) => Math.max(prev - 1, 0))
    }, [])

    const goToNextPage = useCallback(() => {
      _setPageMode("paginate")
      _setPage((prev) => prev + 1)
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

  private _getIndex(indexName = primaryIndexName, indexKey?: string) {
    return indexKey ? `${indexName}-${indexKey}` : indexName
  }
}
