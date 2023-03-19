declare namespace NodeJS {
  interface ProcessEnv {
    PLASMO_PUBLIC_API_URI?: string
    PLASMO_PUBLIC_STRIPE_LINK?: string

    STRIPE_PRIVATE_KEY?: string

    OAUTH_CLIENT_ID?: string

    CRX_PUBLIC_KEY?: string
    CRX_PRIVATE_KEY?: string
  }
}