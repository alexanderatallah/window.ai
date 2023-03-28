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
    const request = this.map.get(id)
    this.completionListeners.get(id).forEach((listener) => {
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
    this.completionListeners.get(id).push(listener)
  }

  removeCompletionListener(
    id: RequestId,
    listener: (v: RequestType, data: ResponseType) => void
  ): void {
    this.completionListeners.set(
      id,
      this.completionListeners.get(id).filter((l) => l !== listener)
    )
  }
}
