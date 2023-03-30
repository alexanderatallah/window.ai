import React from "react"

type Size = "lg" | "xs"

type Strength = "bold" | "dim" | "dimmer" | "italic"

// Note: this component should not include a className prop - the
// point is to add consistency to the text styles.
// Surround it by another one if you need to add a className.
export function Text({
  size,
  strength,
  align,
  truncate,
  lines,
  children
}: {
  size?: Size
  strength?: Strength
  align?: "left" | "center" | "right"
  truncate?: boolean
  lines?: 1 | 2 | 3
  children: React.ReactNode
}) {
  return (
    <p
      className={
        (size === "lg" ? "text-lg " : size === "xs" ? "text-xs " : " ") +
        (strength === "bold"
          ? "font-bold "
          : strength === "dim"
          ? "text-slate-500 dark:text-slate-400 "
          : strength === "dimmer"
          ? "opacity-30 hover:opacity-70 "
          : strength === "italic"
          ? "italic "
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
    </p>
  )
}
