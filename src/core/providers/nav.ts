import { createProvider } from "puro"
import { useContext, useState } from "react"

export type NavPage = "home" | "settings"

const useNavProvider = () => {
  const [page, setPage] = useState<NavPage>("home")

  return {
    page,
    setPage
  }
}

const { BaseContext, Provider } = createProvider(useNavProvider)

export const NavProvider = Provider
export const useNav = () => useContext(BaseContext)
