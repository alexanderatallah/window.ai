import { useState, useEffect } from "react"

export const useMatchMedia = (query: string) => {
  const [isMatch, setIsMatch] = useState<boolean>()

  useEffect(() => {
    if (!globalThis.window?.matchMedia) {
      return
    }

    // set initial value
    const mediaWatcher = globalThis.window.matchMedia(query)
    setIsMatch(mediaWatcher.matches)
    //watch for updates
    function onMediaChanged(e: MediaQueryListEvent) {
      setIsMatch(e.matches)
    }
    mediaWatcher.addEventListener("change", onMediaChanged)

    // clean up after ourselves
    return function cleanup() {
      mediaWatcher.removeEventListener("change", onMediaChanged)
    }
  }, [query])

  return isMatch
}
