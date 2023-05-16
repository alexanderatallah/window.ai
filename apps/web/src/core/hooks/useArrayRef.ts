import { useCallback, useRef } from "react"

export const useArrayRef = <T = string>(
  initialData: T[] = [],
  { limit = 25 } = {}
) => {
  const dataRef = useRef(initialData)

  const add = useCallback((item?: T) => {
    if (item === undefined) {
      return
    }
    dataRef.current = [...dataRef.current, item].slice(-limit)
  }, [])

  const addAll = useCallback((items?: T[]) => {
    if (items === undefined || items.length === 0) {
      return
    }
    dataRef.current = [...dataRef.current, ...items].slice(-limit)
  }, [])

  const remove = useCallback((index: number) => {
    dataRef.current = [
      ...dataRef.current.slice(0, index),
      ...dataRef.current.slice(index + 1)
    ]
  }, [])

  const clear = useCallback(() => {
    dataRef.current = []
  }, [])

  const toString = useCallback(() => dataRef.current.join("\n"), [])

  const render = useCallback(() => dataRef.current, [])

  return {
    render,
    toString,
    add,
    addAll,
    remove,
    clear
  }
}
