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
  const emailParam = encodeURIComponent(userInfo?.email)

  const { data, error } = useSWR<{ active: boolean }>(
    `/api/check-subscription?email=${emailParam}`,
    callAPI
  )
  const isSubscribed = !error && data?.active

  if (!isSubscribed) {
    return (
      <div>
        {error && <div>Failed to fetch subscription: {error.toString()}</div>}
        <button
          disabled={!userInfo}
          onClick={async () => {
            window.open(
              `${process.env.PLASMO_PUBLIC_STRIPE_LINK}?client_reference_id=${userInfo.id}&prefilled_email=${emailParam}`,
              "_blank"
            )
            // TODO do we need oauth?
            // chrome.identity.getAuthToken(
            //   {
            //     interactive: true
            //   },
            //   (token) => {
            //     if (!!token) {
            //       window.open(
            //         `${
            //           process.env.PLASMO_PUBLIC_STRIPE_LINK
            //         }?client_reference_id=${
            //           userInfo.id
            //         }&prefilled_email=${encodeURIComponent(userInfo.email)}`,
            //         "_blank"
            //       )
            //     }
            //   }
            // )
          }}>
          Unlock GPT-4
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={async () => {
        const data = await callAPI("/api/model/call", {
          method: "POST"
        })

        alert(data.code)
      }}>
      Call Paid Model
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
