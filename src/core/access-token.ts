export const getAccessToken = () =>
  new Promise((resolve) =>
    chrome.identity.getAuthToken(null, (token) => {
      if (!!token) {
        resolve(token)
      }
    })
  )
