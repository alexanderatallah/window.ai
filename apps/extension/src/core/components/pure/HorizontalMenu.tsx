type ItemConfig<T> = { label: string; value: T }

export function HorizontalMenu<T>({
  className = "",
  items,
  currentItem,
  onItemSelect
}: {
  className?: string
  items: ItemConfig<T>[]
  currentItem: T
  onItemSelect: (item: T) => void
}) {
  return (
    <div
      className={
        "flex flex-row px-6 py-2 gap-4 bg-indigo-500 hover:bg-indigo-600 transition ease-in-out duration-100 text-white " +
        className
      }>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={
            "text-xs font-semibold" +
            (item.value === currentItem
              ? " opacity-100"
              : " opacity-60 hover:opacity-100")
          }
          onClick={() => onItemSelect(item.value)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}
