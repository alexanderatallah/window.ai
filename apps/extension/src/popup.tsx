import { useEffect } from "react"

import { NavBar } from "~core/components/NavBar"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { configManager } from "~core/managers/config"
import { ConfigProvider } from "~core/providers/config"
import { NavProvider, useNav } from "~core/providers/nav"
import { Activity } from "~core/views/Activity"
import { Apps } from "~core/views/Apps"
import { Settings } from "~core/views/Settings"

import "./style.css"

import { useParams } from "~core/components/hooks/useParams"
import { RequestInterrupt } from "~core/views/RequestInterrupt"

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
        <ConfigProvider>
          <NavFrame />
        </ConfigProvider>
      </NavProvider>
    </main>
  )
}

function NavFrame() {
  const { requestId } = useParams()
  const { view, setSettingsShown, settingsShown } = useNav()

  useEffect(() => {
    async function checkConfig() {
      // This logic allows us to default the settings page on for first-time users
      const config = await configManager.getDefault()
      if (!configManager.isCredentialed(config)) {
        setSettingsShown(true)
      }
    }
    if (!requestId) {
      checkConfig()
    }
  }, [requestId])

  function hideSettings() {
    setSettingsShown(false)
  }

  return (
    <div className="h-full">
      {requestId ? (
        <RequestInterrupt />
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-none">
            <NavBar />
          </div>
          <div className="flex-auto relative overflow-y-auto overflow-x-hidden">
            {view === "activity" && <Activity />}
            {view === "apps" && <Apps />}
          </div>
        </div>
      )}
      <SlidingPane
        shown={settingsShown}
        animated={settingsShown}
        onHide={hideSettings}>
        <Settings onHide={hideSettings} />
      </SlidingPane>
    </div>
  )
}

export default Popup
