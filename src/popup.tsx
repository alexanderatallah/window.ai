import "./style.css"

import { NavBar } from "~core/components/NavBar"
import { NavProvider, useNav } from "~core/providers/nav"
import { Activity } from "~core/views/Activity"
import { Apps } from "~core/views/Apps"

function Popup() {
  return (
    <main
      className={
        "bg-slate-200 dark:bg-slate-800" +
        " text-slate-900 dark:text-slate-200" +
        " md:mx-auto p-0 w-80 h-[32rem]" +
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
    <div className="relative flex flex-col h-full">
      <div className="flex-none">
        <NavBar />
      </div>
      <div className="flex-auto relative overflow-y-auto">
        {view === "activity" && <Activity />}
        {view === "apps" && <Apps />}
      </div>
    </div>
  )
}

export default Popup
