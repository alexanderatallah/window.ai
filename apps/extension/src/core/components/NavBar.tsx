import { WrenchScrewdriverIcon } from "@heroicons/react/24/solid"

import type { NavView } from "~core/providers/nav"
import { useNav } from "~core/providers/nav"

type Tab = { name: string; view: NavView }
export function NavBar() {
  const { view, setView, setSettingsShown } = useNav()

  const tabs: Tab[] = [
    { name: "Activity", view: "activity" },
    { name: "Apps", view: "apps" }
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
        onClick={() => setSettingsShown(true)}>
        <WrenchScrewdriverIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
