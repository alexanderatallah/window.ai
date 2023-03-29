export const getChromeAccessToken = () =>
  new Promise((resolve) =>
    chrome.identity.getAuthToken({}, (token) => {
      if (!!token) {
        resolve(token)
      }
    })
  )

// TODO firefox support
// import browser from "webextension-polyfill"

// export const getAccessToken = () =>
//   new Promise((resolve) =>
//     browser.identity.launchWebAuthFlow({ url: URL, interactive: true }, (token) => {
//       if (!!token) {
//         resolve(token)
//       }
//     })
//   )
