import React from "react"

// Note: this component should not include a className prop - the
// point is to add consistency to the text styles.
// Surround it by another one if you need to add a className.
export function Text({
  size,
  strength,
  dimming,
  align,
  truncate,
  lines,
  children
}: {
  size?: "lg" | "xs"
  strength?: "bold" | "medium" | "italic"
  dimming?: "less" | "more"
  align?: "left" | "center" | "right"
  truncate?: boolean
  lines?: 1 | 2 | 3
  children: React.ReactNode
}) {
  return (
    <div
      className={
        (size === "lg" ? "text-lg " : size === "xs" ? "text-xs " : " ") +
        (strength === "bold"
          ? "font-bold "
          : strength === "medium"
          ? "font-medium "
          : strength === "italic"
          ? "italic "
          : " ") +
        (dimming === "less"
          ? "text-slate-500 dark:text-slate-400 "
          : dimming === "more"
          ? "text-slate-400 dark:text-slate-300 "
          : " ") +
        (truncate ? "truncate " : "") +
        (lines === 1
          ? `line-clamp-1 `
          : lines === 2
          ? `line-clamp-2 `
          : lines === 3
          ? `line-clamp-3 `
          : "") +
        (align === "left"
          ? "text-left "
          : align === "center"
          ? "text-center "
          : align === "right"
          ? "text-right "
          : "")
      }>
      {children}
    </div>
  )
}
