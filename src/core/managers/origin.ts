import { BaseManager } from "./base"

export interface Origin {
  id: string
  domain: string
  path: string
  title: string
  numTransactions?: number
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
}

export const originManager = new OriginsManager()
