import type { RequestId } from "~core/constants"

export class RequestState<RequestType, ResponseType> {
  private map: Map<RequestId, RequestType>
  // These fire when items are removed from the map
  private completionListeners: Map<
    RequestId,
    Array<(v: RequestType, data: ResponseType) => void>
  >

  constructor() {
    this.map = new Map()
    this.completionListeners = new Map()
  }

  start(id: RequestId, request: RequestType): void {
    this.map.set(id, request)
    this.completionListeners.set(id, [])
  }

  complete(id: RequestId, result: ResponseType): void {
    const { request, listeners } = this._assertAndGetRequest(id)
    listeners.forEach((listener) => {
      listener(request, result)
    })
    this.map.delete(id)
    this.completionListeners.delete(id)
  }

  get(id: RequestId): RequestType | undefined {
    return this.map.get(id)
  }

  addCompletionListener(
    id: RequestId,
    listener: (v: RequestType, data: ResponseType) => void
  ): void {
    const { listeners } = this._assertAndGetRequest(id)
    listeners.push(listener)
  }

  removeCompletionListener(
    id: RequestId,
    listener: (v: RequestType, data: ResponseType) => void
  ): void {
    const { listeners } = this._assertAndGetRequest(id)
    this.completionListeners.set(
      id,
      listeners.filter((l) => l !== listener)
    )
  }

  _assertAndGetRequest(id: RequestId): {
    request: RequestType
    listeners: Array<(v: RequestType, data: ResponseType) => void>
  } {
    const request = this.map.get(id)
    if (!request) {
      throw new Error("Request not found")
    }
    const listeners = this.completionListeners.get(id)
    if (!listeners) {
      throw new Error("Listeners not found")
    }
    return { request, listeners }
  }
}
