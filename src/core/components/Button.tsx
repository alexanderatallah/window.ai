import React from "react"

export function Button(props: {
  onClick: React.DOMAttributes<unknown>["onClick"]
  children: React.ReactNode
}) {
  return (
    <button
      className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-600 transition ease-in-out duration-100"
      type="button"
      {...props}>
      {props.children}
    </button>
  )
}
