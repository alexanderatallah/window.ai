import "./style.css"

import { NavBar } from "~core/components/NavBar"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { BACKGROUND_CLASS } from "~core/constants"
import { NavProvider, useNav } from "~core/providers/nav"
import { Activity } from "~core/views/Activity"
import { Settings } from "~core/views/Settings"

function Popup() {
  return (
    <main
      className={
        BACKGROUND_CLASS +
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
  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-none">
        <NavBar />
      </div>
      <div className="flex-auto">
        <Activity />
        <SlidingPane shown={view === "settings"}>
          <Settings />
        </SlidingPane>
      </div>
    </div>
  )
}

export default Popup
