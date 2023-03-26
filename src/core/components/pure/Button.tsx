import React, { ButtonHTMLAttributes, DetailedHTMLProps } from "react"

type ButtonProps = {
  className?: string
} & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>

export function Button({ className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      className={
        "inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 transition ease-in-out duration-100 " +
        "hover:bg-indigo-600 " +
        "disabled:opacity-50 " +
        className
      }
      type="button"
      {...rest}>
      {children}
    </button>
  )
}
