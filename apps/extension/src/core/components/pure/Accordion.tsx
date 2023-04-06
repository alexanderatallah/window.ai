import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid"
import React, { useEffect, useState } from "react"

export function Accordion({
  children,
  title,
  initiallyOpened = false
}: {
  children: React.ReactNode
  title: string
  initiallyOpened?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(initiallyOpened)
  }, [initiallyOpened])

  return (
    <div>
      <button
        type="button"
        className="flex items-center py-2 text-left text-slate-500 dark:text-slate-400 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}>
        {title}
        {isOpen ? (
          <ChevronUpIcon className="ml-2 w-3" />
        ) : (
          <ChevronDownIcon className="ml-2 w-3" />
        )}
      </button>
      {isOpen && children}
    </div>
  )
}
