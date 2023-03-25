import { createProvider } from "puro"
import { useContext, useEffect, useState } from "react"

const useUserInfoProvider = () => {
  const [userInfo, setUserInfo] = useState<chrome.identity.UserInfo>(null)

  useEffect(() => {
    chrome.identity.getProfileUserInfo((data) => {
      if (data.email && data.id) {
        setUserInfo(data)
      }
    })
  }, [])

  return userInfo
}

const { BaseContext, Provider } = createProvider(useUserInfoProvider)

export const useUserInfo = () => useContext(BaseContext)
export const UserInfoProvider = Provider
