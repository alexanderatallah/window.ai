import { useState } from "react"
import React from "react"

import { Button } from "~core/components/Button"
import { Skeleton } from "~core/components/Skeleton"
import { Spinner } from "~core/components/Spinner"
import { useNav } from "~core/providers/nav"

export function Home() {
  const [query, setQuery] = useState("")
  const { setPage } = useNav()
  return (
    <div>
      <input
        // onKeyDown={this.keyDown}
        value={query}
        onInput={(e) => setQuery(e.currentTarget.value)}
        className="w-64 p-4 pl-10 bg-transparent border-none outline-none text-slate-400 rounded-sm"></input>
      <div className="w-80 min-h-48">
        <div
          className={`p-2 grid grid-cols-7 gap-2 cursor-pointer ${
            // ix === selectedIx ? "bg-slate-800" : ""
            ""
          } hover:bg-slate-850`}
          onClick={() => alert("hi")}>
          <div className="emoji">🧠</div>
          <div className="col-span-6 overflow-hidden">
            <div className="overflow-hidden truncate">OpenAI</div>
            <div className="overflow-hidden truncate text-xs text-slate-600">
              Set up GPT-4
            </div>
          </div>
        </div>
        <Skeleton />
      </div>
      <div className={`p-2 text-slate-500`}>
        <Button onClick={() => setPage("settings")}>
          <Spinner />
          Go to settings
        </Button>
      </div>
    </div>
  )
}
