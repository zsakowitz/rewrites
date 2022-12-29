// An item validator with static typing support.

export type Ok<T> = {
  readonly ok: true
  readonly errors?: undefined
  readonly value: T
}

export type Error = {
  readonly ok: false
  readonly errors: readonly string[]
  readonly value?: undefined
}

export type Result<T> = Ok<T> | Error

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function error(reason: string, ...other: string[]): Error
export function error(...errors: readonly [string, ...string[]]): Error {
  return { ok: false, errors }
}

export function getType(data: unknown) {
  return data === null
    ? "null"
    : Array.isArray(data)
    ? "array"
    : data instanceof Map
    ? "map"
    : data instanceof Set
    ? "set"
    : typeof data
}

export type AnyValidator = Validator<any>

export type Infer<T extends AnyValidator> = T extends Validator<infer U>
  ? U
  : never

export abstract class Validator<T> {
  abstract parse(data: unknown): Result<T>

  chain<U>(other: Validator<U>): Validator<U> {
    return new Chain(this, other)
  }

  transform<U>(fn: (data: T) => U): Validator<U> {
    return new Transform(this, fn)
  }

  refine<U extends T>(fn: (data: T) => data is U, reason?: string): Validator<U>
  refine(fn: (data: T) => boolean, reason?: string): Validator<T>
  refine(
    fn: (data: T) => boolean,
    reason = "Refinement failed."
  ): Validator<T> {
    return new Refine(this, fn, reason)
  }
}

class Chain<I, O> extends Validator<O> {
  constructor(readonly base: Validator<I>, readonly other: Validator<O>) {
    super()
  }

  parse(data: unknown): Result<O> {
    const result = this.base.parse(data)

    if (!result.ok) {
      return result
    }

    return this.other.parse(result.value)
  }
}

class Transform<I, O> extends Validator<O> {
  constructor(readonly base: Validator<I>, readonly fn: (data: I) => O) {
    super()
  }

  parse(data: unknown): Result<O> {
    const result = this.base.parse(data)

    if (!result.ok) {
      return result
    }

    return ok(this.fn(result.value))
  }
}

class Refine<I, O extends I> extends Validator<O> {
  constructor(
    readonly base: Validator<I>,
    readonly fn: (data: I) => boolean,
    private readonly reason: string
  ) {
    super()
  }

  parse(data: unknown): Result<O> {
    const result = this.base.parse(data)

    if (result.ok && this.fn(result.value)) {
      return error(this.reason)
    }

    return result as Result<O>
  }
}

class Preprocessed<T> extends Validator<T> {
  constructor(readonly interceptor: (value: unknown) => T) {
    super()
  }

  parse(data: unknown): Result<T> {
    return ok(this.interceptor(data))
  }
}

export function preprocess<T>(
  interceptor: (value: unknown) => T
): Validator<T> {
  return new Preprocessed(interceptor)
}

class StringValidator extends Validator<string> {
  constructor(readonly coerce: boolean) {
    super()
  }

  parse(data: unknown): Result<string> {
    if (this.coerce) {
      return ok(String(data))
    }

    if (typeof data == "string") {
      return ok(data)
    } else {
      return error(`Expected string, received ${getType(data)}`)
    }
  }
}

export const string = new StringValidator(false)
