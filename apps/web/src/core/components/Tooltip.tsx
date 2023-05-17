import clsx from "clsx"
import { useState, type ReactNode } from "react"

export function Tooltip({
  children,
  content,
  above = false
}: {
  above?: boolean
  children: React.ReactNode
  content: React.ReactNode
}) {
  const [visible, setVisible] = useState(false)

  const showTooltip = () => {
    setVisible(true)
  }

  const hideTooltip = () => {
    setVisible(false)
  }

  return (
    <span
      className="relative cursor-pointer"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}>
      {children}
      {visible && (
        <span
          className={clsx(
            above ? "bottom-full" : "top-full",
            "absolute z-10 left-0",
            "mt-2 p-3 w-52 bg-slate-9 text-slate-12 text-xs rounded-md shadow-lg"
          )}>
          {content}
        </span>
      )}
    </span>
  )
}

export default Tooltip
