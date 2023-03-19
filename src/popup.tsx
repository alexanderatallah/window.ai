import useSWR from "swr"

import { callAPI } from "~core/premium-api"
import { UserInfoProvider, useUserInfo } from "~core/user-info"

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
    callAPI
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
        const data = await callAPI(
          "/api/model/call",
          {
            method: "POST"
          },
          {
            prompt: "The quick brown fox"
          }
        )

        alert(data.completion)
      }}>
      The quick brown fox...
    </button>
  )
}

function IndexPopup() {
  return (
    <UserInfoProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 16
        }}>
        <h1>Welcome to LLMixer!</h1>
        <EmailShowcase />
        <PremiumFeatureButton />
      </div>
    </UserInfoProvider>
  )
}

export default IndexPopup
