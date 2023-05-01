import clsx from "clsx"

export function Button({
  className = "bg-slate-9 hover:bg-slate-9/70 active:bg-slate-10 text-slate-12 active:text-slate-12/70",
  ...props
}: any) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 justify-center rounded-md py-2 px-3 text-sm outline-offset-2 transition active:transition-none",
        "font-semibold",
        className
      )}
      {...props}
    />
  )
}
