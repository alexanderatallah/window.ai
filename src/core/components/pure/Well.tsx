export function Well({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-200 dark:bg-slate-700 p-6 rounded-md shadow-md">
      {children}
    </div>
  )
}
