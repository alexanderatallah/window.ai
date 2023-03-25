import useSWR from "swr"

import "./style.css"

import { useState } from "react"
import React from "react"

import { get, post } from "~core/api"
import { Button } from "~core/components/Button"
import { Skeleton } from "~core/components/Skeleton"
import { Spinner } from "~core/components/Spinner"
import type { CompletionResponse } from "~core/constants"
import { useUserInfo } from "~core/user-info"

export function Home(props: { goToSettings: () => void }) {
  const [query, setQuery] = useState("")
  const shouldConfigure = !useUserInfo()
  return (
    <div>
      <input
        // onKeyDown={this.keyDown}
        value={query}
        onInput={(e) => setQuery(e.currentTarget.value)}
        className="w-64 p-4 pl-10 bg-transparent border-none outline-none text-slate-400 rounded-sm"></input>
      <div className="w-80 min-h-48">
        <EmailShowcase />
        <PremiumFeatureButton />
        <div
          className={`p-2 grid grid-cols-7 gap-2 cursor-pointer ${
            // ix === selectedIx ? "bg-slate-800" : ""
            ""
          } hover:bg-slate-850`}
          onClick={() => this.selectTransform(transform)}>
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
      <div
        className={`p-2 ${
          shouldConfigure ? "text-slate-400 font-bold" : "text-slate-500"
        }`}>
        <Button onClick={props.goToSettings}>
          <Spinner />
          {shouldConfigure && "Required - add OpenAI API key"}
          {!shouldConfigure && "Add transform"}
        </Button>
      </div>
    </div>
  )
}

const EmailShowcase = () => {
  const userInfo = useUserInfo()

  return (
    <div>
      Your email is: <b>{userInfo?.email}</b>
    </div>
  )
}

const PremiumFeatureButton = () => {
  const userInfo = useUserInfo()

  const { data, error } = useSWR<{ active: boolean }>(
    `/api/check-subscription`,
    (url) => get<{ active: boolean }>(url)
  )
  const isSubscribed = !error && data?.active

  if (!isSubscribed) {
    return (
      <div>
        {error && (
          <div style={{ color: "red" }}>
            Failed to fetch subscription: {error.toString()}
          </div>
        )}
        <button
          disabled={!userInfo}
          onClick={async () => {
            chrome.identity.getAuthToken(
              {
                interactive: true
              },
              (token) => {
                if (!!token) {
                  window.open(
                    `${
                      process.env.PLASMO_PUBLIC_STRIPE_LINK
                    }?client_reference_id=${
                      userInfo.id
                    }&prefilled_email=${encodeURIComponent(userInfo?.email)}`,
                    "_blank"
                  )
                }
              }
            )
          }}>
          Unlock GPT-4
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={async (e) => {
        const data = await post<CompletionResponse>("/api/model/generate", {
          prompt: "The quick brown fox"
        })

        alert(data.completion)
      }}>
      The quick brown fox...
    </button>
  )
}
