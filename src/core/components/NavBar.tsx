import { WrenchScrewdriverIcon } from "@heroicons/react/24/solid"
import { useEffect, useState } from "react"

import { transactionManager } from "~core/managers/transaction"
import { NavView, useNav } from "~core/providers/nav"
import { Settings } from "~core/views/Settings"

import { SlidingPane } from "./pure/SlidingPane"

type Tab = { name: string; view: NavView }
export function NavBar() {
  const { view, setView } = useNav()
  const { objects } = transactionManager.useObjects(1)
  const doTransactionsExist = objects.length > 0
  const [shouldShowSettings, setShouldShowSettings] = useState(true)

  useEffect(() => {
    // This logic allows us to default the settings page on for first-time users
    setShouldShowSettings(!doTransactionsExist)
  }, [doTransactionsExist])

  const tabs: Tab[] = [
    { name: "Activity", view: "activity" }
    // { name: "Apps", view: "apps" }
  ]
  return (
    <div className="flex flex-row p-2">
      <div className="w-full flex flex-row">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            type="button"
            className={
              "px-4 py-2 rounded-full font-semibold" +
              " transition-all duration-200 ease-in-out" +
              (view === tab.view
                ? " text-slate-700 dark:text-slate-200 bg-slate-300 dark:bg-slate-700"
                : " text-slate-500 dark:text-slate-400")
            }
            onClick={() => setView(tab.view)}>
            {tab.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="flex-none rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700"
        onClick={() => setShouldShowSettings(true)}>
        <WrenchScrewdriverIcon className="h-5 w-5" />
      </button>

      <SlidingPane
        shown={shouldShowSettings}
        animated={shouldShowSettings}
        onHide={
          doTransactionsExist ? () => setShouldShowSettings(false) : undefined
        }>
        <Settings />
      </SlidingPane>
    </div>
  )
}
