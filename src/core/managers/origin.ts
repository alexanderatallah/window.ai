import { BaseManager } from "./base"

export interface Origin {
  id: string
  domain: string
  path: string
  title: string
}

class OriginsManager extends BaseManager<Origin> {
  constructor() {
    super("origins")
  }

  init(origin: string, pathName: string, title: string): Origin {
    return {
      id: origin + pathName,
      domain: origin,
      path: pathName,
      title
    }
  }

  url(origin: Origin): string {
    return origin.domain + origin.path
  }

  originDisplay(origin: Origin): string {
    const url = origin.domain
    const withoutProtocol = url.split("//")[1]
    const withoutWWW = withoutProtocol.replace(/^www\./, "")
    return withoutWWW
  }
}

export const originManager = new OriginsManager()
