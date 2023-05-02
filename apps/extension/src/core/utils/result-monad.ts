export type Ok<T> = {
  __kind: "OK"
  data: T
}

export type Err<E> = {
  __kind: "ERR"
  error: E
}

export const ok = <T>(data: T): Ok<T> => ({ __kind: "OK", data })
export const err = <E>(error: E): Err<E> => ({ __kind: "ERR", error })
export const unknownErr = (error: unknown): Err<string> =>
  err(error instanceof Error ? error.message : `${error}`)

export type Result<T, E> = Ok<T> | Err<E>

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.__kind === "OK"
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => r.__kind === "ERR"

export const unwrap = <T, E>(r: Result<T, E>) => {
  if (isOk(r)) {
    return r.data
  } else {
    throw r.error
  }
}
