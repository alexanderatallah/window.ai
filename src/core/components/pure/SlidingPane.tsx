import { XMarkIcon } from "@heroicons/react/24/solid"
import React from "react"

export function SlidingPane({
  shown = false,
  animated = true,
  onHide,
  children
}: {
  animated?: boolean
  children: React.ReactNode
  shown: boolean
  onHide?: () => void
}) {
  return (
    <div
      className={
        "bg-slate-200 dark:bg-slate-800" +
        ` p-4 z-10 fixed top-0 left-0 right-0 bottom-0 overflow-y-auto ${
          !shown ? "translate-x-full " : "translate-x-0 "
        }` +
        (animated ? "transition-transform duration-200 ease-in-out " : "")
      }>
      {onHide && (
        <button
          type="button"
          className="fixed right-0 top-0 px-4 py-4 text-lg text-slate-500 bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700"
          onClick={onHide}>
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
      {children}
    </div>
  )
}
