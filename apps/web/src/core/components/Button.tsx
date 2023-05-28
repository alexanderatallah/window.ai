import clsx from "clsx"

export function Button({
  className = "bg-slate-8 hover:bg-slate-8/70 active:bg-slate-10 text-slate-12 active:text-slate-12/70 w-full text-sm",
  ...props
}: any) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 justify-center rounded-md py-2 px-3 outline-offset-2 transition active:transition-none",
        "font-semibold",
        className
      )}
      {...props}
    />
  )
}
