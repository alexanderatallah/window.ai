import { ChevronUpDownIcon } from "@heroicons/react/24/solid"
import { useState } from "react"

export function Dropdown({
  children,
  choices,
  onSelect
}: {
  children: React.ReactNode
  choices: string[]
  onSelect: (choice: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        className="inline-flex justify-center w-full rounded-md border border-indigo-300 shadow-sm px-4 py-2 bg-indigo-100 text-sm font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        id="options-menu"
        aria-haspopup="true"
        aria-expanded="true"
        onClick={() => setIsOpen(!isOpen)}>
        {children}
        <ChevronUpDownIcon className="ml-2 h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className="absolute z-10 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu">
          <div className="py-1" role="none">
            {choices.map((choice) => (
              <button
                key={choice}
                className="block text-left w-full px-4 py-2 pr-8 text-slate-700 hover:bg-indigo-100 hover:text-indigo-900 focus:outline-none focus:bg-indigo-100 focus:text-indigo-900"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false)
                  onSelect(choice)
                }}>
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
