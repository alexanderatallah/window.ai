import { UserInfoProvider, useUserInfo } from "~core/user-info"

const EmailShowcase = () => {
  const userInfo = useUserInfo()

  return (
    <div>
      Your email is: <b>{userInfo?.email}</b>
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
        <h1>
          Welcome to your <a href="https://www.plasmo.com">Plasmo</a> Extension!
        </h1>
        <EmailShowcase />
      </div>
    </UserInfoProvider>
  )
}

export default IndexPopup
