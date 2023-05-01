import { createProvider } from "puro"
import { useContext, useEffect, useState } from "react"

export type NavView = "activity" | "apps"

const useNavProvider = () => {
  const [view, setView] = useState<NavView>("activity")
  const [settingsShown, setSettingsShown] = useState(false)

  return {
    view,
    settingsShown,
    setView,
    setSettingsShown
  }
}

const { BaseContext, Provider } = createProvider(useNavProvider)

export const NavProvider = Provider
export const useNav = () => useContext(BaseContext)
