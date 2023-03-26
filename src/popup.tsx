import "./style.css"

import { NavBar } from "~core/components/NavBar"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { NavProvider, useNav } from "~core/providers/nav"
import { Activity } from "~core/views/Activity"
import { Apps } from "~core/views/Apps"
import { Settings } from "~core/views/Settings"

function Popup() {
  return (
    <main
      className={
        "bg-slate-200 dark:bg-slate-800" +
        " text-slate-900 dark:text-slate-200" +
        " md:mx-auto p-0 w-80 h-[30rem]" +
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
  const showActivity = view === "activity" || view === "settings"
  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-none">
        <NavBar />
      </div>
      <div className="flex-auto">
        {showActivity && <Activity />}
        {view === "apps" && <Apps />}
        <SlidingPane shown={view === "settings"}>
          <Settings />
        </SlidingPane>
      </div>
    </div>
  )
}

export default Popup
