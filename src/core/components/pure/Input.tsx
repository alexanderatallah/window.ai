import React from "react"

import { Spinner } from "./Spinner"

export function Input({
  value,
  onChange,
  onBlur,
  placeholder,
  label,
  required,
  loading
}: {
  value: string
  onChange: (newValue: string) => void
  onBlur?: (newValue: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  loading?: boolean
}) {
  return (
    <div className={"w-full " + (loading ? "relative " : "")}>
      {label && (
        <label
          htmlFor={label}
          className="block text-indigo-700 text-sm font-medium">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="text"
        name={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur && onBlur(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full px-4 py-2 border border-slate-300 bg-slate-200 rounded-md shadow-sm text-indigo-900 focus:border-indigo-300 focus:ring focus:ring-indigo-200 required:border-red-500 focus:ring-opacity-50"
      />
      {loading && <Spinner className="absolute right-0" />}
    </div>
  )
}
