import { useState } from "react"
import useSWR from "swr"

import { get, post } from "~core/api"
import { Button } from "~core/components/pure/Button"
import { Spinner } from "~core/components/pure/Spinner"
import type { CompletionResponse } from "~core/constants"
import { UserInfoProvider, useUserInfo } from "~core/providers/user-info"

export function Settings({ onSave }: { onSave: () => void }) {
  return (
    <UserInfoProvider>
      <div className="h-auto">
        <div className="text-2xl font-bold">Settings</div>
        <div className="text-sm text-slate-500">
          <EmailShowcase />
        </div>
        <div className="mt-4">
          <div className="text-lg font-bold">Premium features</div>
          <div className="text-sm text-slate-500">
            <PremiumFeatureButton />
          </div>
        </div>
        <Button onClick={onSave}>Save</Button>
      </div>
    </UserInfoProvider>
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
  const [loading, setLoading] = useState(false)

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
    <Button
      onClick={async (e) => {
        setLoading(true)
        const data = await post<CompletionResponse>("/api/model/complete", {
          prompt: "The quick brown fox"
        })
        setLoading(false)
        alert(data.text)
      }}
      disabled={loading}
      className="bg-slate-300">
      The quick brown fox... {loading && <Spinner />}
    </Button>
  )
}
