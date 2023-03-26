import { createProvider } from "puro"
import { useContext, useState } from "react"

export type NavView = "activity" | "apps" | "settings"

const useNavProvider = () => {
  const [view, setView] = useState<NavView>("activity")

  return {
    view,
    setView
  }
}

const { BaseContext, Provider } = createProvider(useNavProvider)

export const NavProvider = Provider
export const useNav = () => useContext(BaseContext)
