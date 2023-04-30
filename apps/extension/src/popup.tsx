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
  const permissionPort = usePermissionPort()
  const isPermissionRequest = !!permissionPort.requestId
  const { view, setSettingsShown, settingsShown } = useNav()

  useEffect(() => {
    async function checkConfig() {
      // This logic allows us to default the settings page on for first-time users
      const config = await configManager.getDefault()
      if (!configManager.isCredentialed(config)) {
        setSettingsShown(true)
      }
    }
    if (!isPermissionRequest) {
      checkConfig()
    }
  }, [isPermissionRequest])

  return (
    <div className="h-full">
      {permissionPort.data ? (
        <PermissionRequest
          data={permissionPort.data}
          onResult={(permitted) =>
            permissionPort.requestId &&
            permissionPort.send({
              request: {
                permitted,
                requesterId: permissionPort.requestId
              }
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
