import React, { ButtonHTMLAttributes, DetailedHTMLProps } from "react"

import { Spinner } from "./Spinner"

type ButtonProps = {
  // Don't add className here - should be modified in the component props
  centered?: boolean
  loading?: boolean
  wide?: boolean
} & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>

export function Button({
  centered = true,
  loading,
  children,
  wide,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={
        "inline-flex items-center px-6 py-2 font-semibold leading-6 shadow rounded-md text-white bg-indigo-500 transition ease-in-out duration-100 " +
        "hover:bg-indigo-600 " +
        "disabled:opacity-50 " +
        (centered ? "justify-center " : "justify-start ") +
        (loading ? "relative " : "") +
        (wide ? "w-full " : "")
      }
      type="button"
      disabled={loading || rest.disabled}
      {...rest}>
      {children}
      {loading && <Spinner className="absolute right-0" />}
    </button>
  )
}
