// A generic result type that can express a possibly failed result.

export type Error = {
  readonly ok: false
  readonly error: string
  readonly value?: undefined
}

export type Ok<T> = {
  readonly ok: true
  readonly error?: undefined
  readonly value: T
}

export type Result<T> = Ok<T> | Error

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function error(error: string): Error {
  return { ok: false, error }
}

function unwrap<T>(result: Result<T>): T {
  if (result.ok) {
    return result.value
  }

  throw new Error(result.error)
}

export function coroutine<T>(
  fn: (unwrap: <U>(result: Result<U>) => U) => Result<T>,
) {
  try {
    return ok(fn(unwrap))
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err))
  }
}
