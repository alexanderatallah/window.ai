import type { RequestId } from "~core/constants"

export class RequestState<Request, CompletionData> {
  private map: Map<RequestId, Request>
  // These fire when items are removed from the map
  private completionListeners: Map<
    RequestId,
    Array<(v: Request, data: CompletionData) => void>
  >

  constructor() {
    this.map = new Map()
    this.completionListeners = new Map()
  }

  start(id: RequestId, request: Request): void {
    this.map.set(id, request)
    this.completionListeners.set(id, [])
  }

  complete(id: RequestId, result: CompletionData): void {
    const request = this.map.get(id)
    this.completionListeners.get(id).forEach((listener) => {
      listener(request, result)
    })
    this.map.delete(id)
    this.completionListeners.delete(id)
  }

  get(id: RequestId): Request | undefined {
    return this.map.get(id)
  }

  addCompletionListener(
    id: RequestId,
    listener: (v: Request, data: CompletionData) => void
  ): void {
    this.completionListeners.get(id).push(listener)
  }

  removeCompletionListener(
    id: RequestId,
    listener: (v: Request, data: CompletionData) => void
  ): void {
    this.completionListeners.set(
      id,
      this.completionListeners.get(id).filter((l) => l !== listener)
    )
  }
}
