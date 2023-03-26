import React from "react"

export function SlidingPane({
  shown = false,
  onHide,
  children
}: {
  children: React.ReactNode
  shown: boolean
  onHide?: () => void
}) {
  return (
    <div
      className={
        "bg-slate-200 dark:bg-slate-800" +
        ` p-4 absolute top-0 left-0 right-0 bottom-0 transition-transform duration-200 ease-in-out ${
          !shown ? "translate-x-full" : "translate-x-0"
        }`
      }>
      {onHide && (
        <button
          type="button"
          className="fixed right-0 top-0 px-4 py-2 text-lg text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700"
          onClick={onHide}>
          x
        </button>
      )}
      {children}
    </div>
  )
}
