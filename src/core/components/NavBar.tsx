import { NavView, useNav } from "~core/providers/nav"

export function NavBar() {
  const { view, setView } = useNav()

  const tabs = [{ name: "Activity", view: "activity" as NavView }]
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
        className="flex-none rounded-lg px-2 py-1 text-lg hover:bg-slate-300"
        onClick={() => setView("settings")}>
        ⚙️
      </button>
    </div>
  )
}
