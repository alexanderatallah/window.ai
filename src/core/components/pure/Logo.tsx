// Either imgSrc or faviconFor must be provided
export function Logo({
  className = "",
  imgSrc,
  faviconFor,
  size = 32
}: {
  className?: string
  imgSrc?: string
  faviconFor?: string
  size?: number
}) {
  const src =
    imgSrc ||
    `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${faviconFor}&size=${size}`
  return (
    <div className={" " + className}>
      <img alt="logo" src={src} />
    </div>
  )
}
