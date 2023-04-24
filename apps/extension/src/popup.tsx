import { useEffect, useRef } from "react"

import { NavBar } from "~core/components/NavBar"
import { usePermissionPort } from "~core/components/hooks/usePermissionPort"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { configManager } from "~core/managers/config"
import { ConfigProvider } from "~core/providers/config"
import { NavProvider, useNav } from "~core/providers/nav"
import { Activity } from "~core/views/Activity"
import { Apps } from "~core/views/Apps"
import { PermissionRequest } from "~core/views/PermissionRequest"
import { Settings } from "~core/views/Settings"

import "./style.css"

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
  const port = usePermissionPort()
  const isPermissionRequest = !!port.data
  const { view, setSettingsShown, settingsShown } = useNav()
  const timeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    async function checkConfig() {
      if (isPermissionRequest) {
        return
      }
      const config = await configManager.getDefault()
      // This logic allows us to default the settings page on for first-time users
      if (!configManager.isCredentialed(config)) {
        setSettingsShown(true)
      }
    }
    // HACK: wait for permission request to be set
    if (timeout.current) {
      clearTimeout(timeout.current)
    }
    timeout.current = setTimeout(checkConfig, 50)
    return () => {
      clearTimeout(timeout.current)
    }
  }, [isPermissionRequest])

  return (
    <div className="h-full">
      {isPermissionRequest ? (
        <PermissionRequest
          data={port.data}
          onResult={(permitted) =>
            "requesterId" in port.data &&
            port.send({
              request: { permitted, requesterId: port.data.requesterId }
            })
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
