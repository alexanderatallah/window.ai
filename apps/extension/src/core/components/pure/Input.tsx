import React from "react"

import { Spinner } from "./Spinner"

export function Input({
  value,
  type = "text",
  name,
  onChange,
  onBlur,
  onEnter,
  placeholder,
  children,
  required,
  loading
}: {
  value: string
  name?: string
  type?: "text" | "password" | "email" | "number" | "url"
  onChange: (newValue: string) => void
  onBlur?: (newValue: string) => void
  onEnter?: () => void
  placeholder?: string
  children?: React.ReactNode
  required?: boolean
  loading?: boolean
}) {
  return (
    <div className="w-full">
      {children}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onBlur && onBlur(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              onEnter()
            }
          }}
          placeholder={placeholder}
          required={required}
          className="mt-2 w-full px-4 py-2 border dark:bg-slate-200 rounded-md shadow-sm text-slate-900 focus:border-indigo-300 focus:ring focus:ring-indigo-200 required:border-red-500 focus:ring-opacity-50"
        />
        {loading && <Spinner className="absolute right-0" />}
      </div>
    </div>
  )
}
