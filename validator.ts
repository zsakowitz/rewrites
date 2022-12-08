// A type-first validator with full typing support.

type MakeUndefinedOptional<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: T[K]
}

type UnwrapValidatorRecord<T> = {
  [K in keyof T]: T[K] extends Validator<infer U> ? U : never
}

export class Validator<T> {
  constructor(public check: (value: any) => value is T) {}

  debug(value: any) {
    console.log(value, this.check(value))
  }

  or<U>(other: Validator<U>) {
    return new Validator(
      (value): value is T | U => this.check(value) || other.check(value)
    )
  }

  and<U>(other: Validator<U>) {
    return new Validator(
      (value): value is T & U => this.check(value) && other.check(value)
    )
  }

  not(): Validator<unknown>
  not<U>(other: Validator<U>): Validator<Exclude<T, U>>
  not<U>(other?: Validator<U>) {
    if (other) {
      return new Validator(
        (value): value is Exclude<T, U> =>
          this.check(value) && !other.check(value)
      )
    } else {
      return new Validator((value): value is unknown => !this.check(value))
    }
  }

  optional(): Validator<T | undefined> {
    return this.or(undefined())
  }
}

export class ArrayValidator<T> extends Validator<T[]> {
  constructor(protected itemValidator: Validator<T> = any()) {
    super(
      (value): value is T[] =>
        Array.isArray(value) &&
        value.every((element) => itemValidator.check(element))
    )
  }
}

export class ObjectValidator<
  T extends Record<string | number | symbol, Validator<unknown>>
> extends Validator<{
  [K in keyof MakeUndefinedOptional<
    UnwrapValidatorRecord<T>
  >]: MakeUndefinedOptional<UnwrapValidatorRecord<T>>[K]
}> {
  protected object: [string | number | symbol, Validator<unknown>][]

  constructor(object: T) {
    super(
      (value): value is MakeUndefinedOptional<UnwrapValidatorRecord<T>> =>
        typeof value === "object" &&
        value !== null &&
        this.object.every(([k, v]) => v.check(value[k]))
    )

    this.object = Object.entries(object)
  }
}

type Primitives = {
  bigint: bigint
  boolean: boolean
  number: number
  string: string
  symbol: symbol
  undefined: undefined
}

type Primitive = bigint | boolean | null | number | string | symbol | undefined

export function primitive(type: "bigint"): Validator<bigint>
export function primitive(type: "boolean"): Validator<boolean>
export function primitive(type: "number"): Validator<number>
export function primitive(type: "string"): Validator<string>
export function primitive(type: "symbol"): Validator<symbol>
export function primitive(type: "undefined"): Validator<undefined>
export function primitive<T extends keyof Primitives>(type: T) {
  return new Validator((value): value is Primitives[T] => typeof value === type)
}

export const bigint = () => primitive("bigint")
export const boolean = () => primitive("boolean")
export const number = () => primitive("number")
export const string = () => primitive("string")
export const symbol = () => primitive("symbol")
export const undefined = () => primitive("undefined")

const _null = () => new Validator((value): value is null => value === null)
export { _null as null }

const _function = () =>
  new Validator(
    (
      value
    ): value is ((...args: any[]) => any) | (new (...args: any[]) => any) =>
      typeof value === "function"
  )
export { _function as function }

export const any = () => new Validator((_value): _value is any => true)
export const never = () => new Validator((_value): _value is never => false)

export const is = <T extends Primitive>(value: T) =>
  new Validator((_value): _value is T => _value === value)

export function array<T = unknown>(item?: Validator<T>) {
  return new ArrayValidator(item)
}

export namespace array {
  export function empty() {
    return new ArrayValidator(never())
  }
}

export function object<
  T extends Record<string | number | symbol, Validator<unknown>>
>(object: T) {
  return new ObjectValidator(object)
}

const myObj = object({
  a: is(2).optional(),
  b: string(),
  c: array(boolean()),
})

const b = null! as any
if (myObj.check(b)) {
  b.a
}
