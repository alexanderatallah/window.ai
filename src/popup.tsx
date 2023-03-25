import "./style.css"

import { NavProvider, useNav } from "~core/providers/nav"
import { Home } from "~core/views/Home"
import { Settings } from "~core/views/Settings"

const backgroundClass = "bg-slate-200 dark:bg-slate-800"

function Popup() {
  return (
    <main
      className={
        backgroundClass +
        " text-slate-900 dark:text-slate-200" +
        " p-0 leading-5 font-sans"
      }>
      <NavProvider>
        <>
          <Home />
          <SettingsSlider />
        </>
      </NavProvider>
    </main>
  )
}

function SettingsSlider() {
  const { page } = useNav()
  const shouldHide = page !== "settings"
  return (
    <div
      className={
        backgroundClass +
        ` p-4 fixed top-0 left-0 right-0 bottom-0 transition-transform duration-200 ease-in-out ${
          shouldHide ? "translate-x-full" : "translate-x-0"
        }`
      }>
      <Settings />
    </div>
  )
}

export default Popup
