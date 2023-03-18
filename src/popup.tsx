import { UserInfoProvider, useUserInfo } from "~core/user-info"

const EmailShowcase = () => {
  const userInfo = useUserInfo()

  return (
    <div>
      Your email is: <b>{userInfo?.email}</b>
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
                  }&prefilled_email=${encodeURIComponent(userInfo.email)}`,
                  "_blank"
                )
              }
            }
          )
        }}>
        Unlock GPT-4 with Stripe
      </button>
    </div>
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
      </div>
    </UserInfoProvider>
  )
}

export default IndexPopup
