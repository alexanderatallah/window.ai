import "./style.css"

import { useEffect } from "react"

import { NavBar } from "~core/components/NavBar"
import { usePermissionPort } from "~core/components/hooks/usePermissionPort"
import { SlidingPane } from "~core/components/pure/SlidingPane"
import { transactionManager } from "~core/managers/transaction"
import { NavProvider, useNav } from "~core/providers/nav"
import { Activity } from "~core/views/Activity"
import { Apps } from "~core/views/Apps"
import { PermissionRequest } from "~core/views/PermissionRequest"
import { Settings } from "~core/views/Settings"

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
  const port = usePermissionPort()
  const { view, setSettingsShown, settingsShown } = useNav()
  const { objects } = transactionManager.useObjects(1)
  const doTransactionsExist = objects.length > 0

  useEffect(() => {
    // This logic allows us to default the settings page on for first-time users
    setSettingsShown(!doTransactionsExist)
  }, [doTransactionsExist])

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
        onHide={
          doTransactionsExist ? () => setSettingsShown(false) : undefined
        }>
        <Settings />
      </SlidingPane>
    </div>
  )
}

export default Popup
