import "./style.css"

import { NavBar } from "apps/extension/src/core/components/NavBar"
import { usePermissionPort } from "apps/extension/src/core/components/hooks/usePermissionPort"
import { SlidingPane } from "apps/extension/src/core/components/pure/SlidingPane"
import { configManager } from "apps/extension/src/core/managers/config"
import { ModelProvider } from "apps/extension/src/core/providers/model"
import { NavProvider, useNav } from "apps/extension/src/core/providers/nav"
import { Activity } from "apps/extension/src/core/views/Activity"
import { Apps } from "apps/extension/src/core/views/Apps"
import { PermissionRequest } from "apps/extension/src/core/views/PermissionRequest"
import { Settings } from "apps/extension/src/core/views/Settings"
import { useEffect } from "react"

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
        <ModelProvider>
          <NavFrame />
        </ModelProvider>
      </NavProvider>
    </main>
  )
}

function NavFrame() {
  const port = usePermissionPort()
  const { view, setSettingsShown, settingsShown } = useNav()

  useEffect(() => {
    async function checkConfig() {
      const config = await configManager.getDefault()
      if (configManager.isIncomplete(config)) {
        // This logic allows us to default the settings page on for first-time users
        setSettingsShown(true)
      }
    }
    checkConfig()
  }, [])

  return (
    <div className="h-full">
      {port?.data ? (
        <PermissionRequest
          data={port.data}
          onResult={(permitted) =>
            port.data.id && port.send({ id: port.data.id, permitted })
          }
        />
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
        onHide={() => setSettingsShown(false)}>
        <Settings />
      </SlidingPane>
    </div>
  )
}

export default Popup
