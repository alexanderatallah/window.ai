import useSWR from "swr"

import { get, post } from "~core/api"
import type { CompletionResponse } from "~core/constants"
import { UserInfoProvider, useUserInfo } from "~core/providers/user-info"

export function Settings() {
  return (
    <UserInfoProvider>
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
        const data = await post<CompletionResponse>("/api/model/complete", {
          prompt: "The quick brown fox"
        })

        alert(data.completion)
      }}>
      The quick brown fox...
    </button>
  )
}
