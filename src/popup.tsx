import "./style.css"

import { NavProvider, useNav } from "~core/providers/nav"
import { Activity } from "~core/views/Activity"
import { Settings } from "~core/views/Settings"

import { NavBar } from "./core/components/NavBar"

const backgroundClass = "bg-slate-200 dark:bg-slate-800"

function Popup() {
  return (
    <main
      className={
        backgroundClass +
        " text-slate-900 dark:text-slate-200" +
        " md:container md:mx-auto p-0 h-96" +
        " text-sm font-sans"
      }>
      <NavProvider>
        <NavFrame />
      </NavProvider>
    </main>
  )
}

function NavFrame() {
  const { view } = useNav()
  return (
    <div>
      <NavBar />
      <Activity />
      <div
        className={
          backgroundClass +
          ` p-4 fixed top-0 left-0 right-0 bottom-0 transition-transform duration-200 ease-in-out ${
            view !== "settings" ? "translate-x-full" : "translate-x-0"
          }`
        }>
        <Settings />
      </div>
    </div>
  )
}

export default Popup
