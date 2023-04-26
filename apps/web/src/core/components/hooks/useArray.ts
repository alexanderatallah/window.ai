import { useCallback, useState } from "react"

export const useArray = <T = string>(initialData: T[] = []) => {
  const [data, setData] = useState(initialData)

  const add = useCallback((item: T) => {
    setData((data) => [...data, item])
  }, [])

  const remove = useCallback((index: number) => {
    setData((data) => [...data.slice(0, index), ...data.slice(index + 1)])
  }, [])

  const clear = useCallback(() => {
    setData([])
  }, [])

  return {
    data,
    add,
    remove,
    clear
  }
}
