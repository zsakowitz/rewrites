// An item validator with static typing support.

// #region result
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
// #endregion

// #region AnyValidator, Infer, Modifier, and joinErrors
export type AnyValidator = Validator<any>

export type Infer<T extends AnyValidator> = T extends Validator<infer U>
  ? U
  : never

export type Modifier<I, O> = (value: I) => Result<O>

function joinErrors(first: string, rest: readonly string[]): readonly string[] {
  if (rest.length == 0) {
    return [first]
  }

  return [first + rest[0]].concat(rest.slice(1))
}
// #endregion

class Validator<T> {
  protected readonly core: readonly Modifier<unknown, unknown>[] = []

  constructor(protected readonly modifiers: readonly Modifier<any, any>[]) {}

  protected duplicate(newModifiers: readonly Modifier<any, any>[]): this {
    return new (this.constructor as typeof Validator)(newModifiers) as this
  }

  as<T extends new (modifiers: readonly Modifier<any, any>[]) => Validator<T>>(
    type: T
  ): InstanceType<T> {
    const output = new type(this.modifiers)
    ;(output.core as Modifier<unknown, unknown>[]).unshift(...this.core)
    return output as InstanceType<T>
  }

  parse(data: unknown): Result<T> {
    for (const modifier of this.core) {
      const result = modifier(data)

      if (!result.ok) {
        return result
      }

      data = result.value
    }

    for (const modifier of this.modifiers) {
      const result = modifier(data)

      if (!result.ok) {
        return result
      }

      data = result.value
    }

    return ok(data as T)
  }

  parseOrThrow(data: unknown): T {
    const result = this.parse(data)

    if (!result.ok) {
      throw new AggregateError(result.errors, `Validation failed.`)
    }

    return result.value
  }

  chain<U>(modifier: Modifier<T, U>): Validator<U> {
    return new Validator(this.modifiers.concat(modifier))
  }

  transform<U>(transformer: (data: T) => U): Validator<U> {
    return this.chain((data) => ok(transformer(data)))
  }

  refine<U extends T>(
    refiner: (data: T) => data is U,
    reason?: string
  ): Validator<U> & Omit<this, keyof Validator<T>>
  refine(refiner: (data: T) => boolean, reason?: string): this
  refine(refiner: (data: T) => boolean, reason = "Refinement failed."): this {
    return this.duplicate(
      this.modifiers.concat((data) =>
        refiner(data) ? ok(data) : error(reason)
      )
    )
  }

  or<U>(other: Validator<U>): Validator<T | U> {
    return z.chain<T | U>((data) => {
      const result1 = this.parse(data)

      if (result1.ok) {
        return result1
      }

      const result2 = other.parse(data)

      if (result2.ok) {
        return result2
      }

      return error(
        `'or' failed to match any of its inputs. The last validator errored with`,
        ...result2.errors
      )
    })
  }

  array(): ArrayValidator<T, false> {
    return array.item(this)
  }

  optional(): Validator<T | undefined> {
    return this.or(undefined)
  }
}

// #region transform and refine
export function transform<T, U>(fn: (data: T) => U): Modifier<T, U> {
  return (data) => ok(fn(data))
}

export function refine<T, U extends T>(
  fn: (data: T) => data is U,
  reason?: string
): Modifier<T, U>
export function refine<T>(
  fn: (data: T) => boolean,
  reason?: string
): Modifier<T, T>
export function refine<T>(
  fn: (data: T) => boolean,
  reason = "Refinement failed."
): Modifier<T, T> {
  return (data) => (fn(data) ? ok(data) : error(reason))
}
// #endregion

export const z = new Validator([])

class StringValidator<
  Start extends string = "",
  End extends string = ""
> extends Validator<`${Start}${string}${End}`> {
  protected readonly core = [
    refine(
      (data): data is string => typeof data == "string",
      `Expected a string.`
    ),
  ] as const

  min(length: number) {
    return this.refine((data) => data.length >= length)
  }

  max(length: number) {
    return this.refine((data) => data.length <= length)
  }

  regex(regex: RegExp) {
    return this.refine((data) => !!data.match(regex))
  }

  startsWith<T extends `${Start}${string}`>(text: T): StringValidator<T, End> {
    return this.refine((data): data is `${T}${string}${End}` & typeof data =>
      data.startsWith(text)
    ) as unknown as StringValidator<T, End>
  }

  endsWith<T extends `${string}${End}`>(text: T): StringValidator<Start, T> {
    return this.refine((data): data is `${Start}${string}${T}` & typeof data =>
      data.endsWith(text)
    ) as unknown as StringValidator<Start, T>
  }
}

export const string = new StringValidator([])

class NumberValidator extends Validator<number> {
  protected readonly core = [
    refine(
      (data): data is number => typeof data == "number",
      `Expected a number.`
    ),
  ] as const

  min(value: number) {
    return this.refine((data) => data >= value)
  }

  max(value: number) {
    return this.refine((data) => data <= value)
  }
}

export const number = new NumberValidator([])

class BigIntValidator extends Validator<bigint> {
  protected readonly core = [
    refine(
      (data): data is bigint => typeof data == "bigint",
      `Expected a bigint.`
    ),
  ] as const

  min(value: bigint) {
    return this.refine((data) => data >= value)
  }

  max(value: bigint) {
    return this.refine((data) => data <= value)
  }
}

export const bigint = new BigIntValidator([])

export const boolean = z.refine(
  (data): data is boolean => typeof data == "boolean",
  `Expected a boolean.`
)

export const symbol = z.refine(
  (data): data is symbol => typeof data == "symbol",
  `Expected a symbol.`
)

const Null = z.refine((data): data is null => data === null, `Expected null.`)

export { Null as null }

export const undefined = z.refine(
  (data): data is undefined => typeof data == "undefined",
  `Expected undefined.`
)

class ArrayValidator<T, NonEmpty extends boolean = false> extends Validator<
  NonEmpty extends true ? readonly [T, ...(readonly T[])] : readonly T[]
> {
  protected readonly core = [
    refine(
      (data): data is readonly T[] => Array.isArray(data),
      `Expected an array.`
    ),
    transform((data: readonly T[]) => [...data]),
  ] as any

  item<U>(item: Validator<U>): ArrayValidator<U> {
    return this.chain((data) => {
      let ok = true
      const errors = []
      const value = []

      // `for-of` loops skip over empty elements, so we have to use an indexed loop.
      for (let index = 0; index < data.length; index++) {
        const result = item.parse(data[index])

        if (!result.ok) {
          ok = false
          errors.push(...result.errors)
        } else {
          value.push(result.value)
        }
      }

      return ok ? { ok, value } : { ok, errors }
    }) as unknown as ArrayValidator<U>
  }

  nonEmpty(): ArrayValidator<T, true> {
    return this.refine((data) => data.length > 0) as ArrayValidator<T, true>
  }

  min(length: number) {
    return this.refine((data) => data.length >= length)
  }

  max(length: number) {
    return this.refine((data) => data.length <= length)
  }

  length(length: number) {
    return this.refine((data) => data.length == length)
  }
}

export const array = new ArrayValidator([])

class TupleValidator<T extends readonly unknown[] = []> extends Validator<T> {
  protected readonly core = [
    refine(
      (data): data is readonly unknown[] => Array.isArray(data),
      `Expected an array.`
    ),
    transform((data: readonly unknown[]) => [...data]),
    (data: readonly unknown[]): Result<T> => {
      let ok = true
      const errors: string[] = []
      const value = []

      // `for-of` loops skip over empty elements, so we have to use an indexed loop.
      for (let index = 0; index < this.tupleItems.length; index++) {
        const result = this.tupleItems[index].parse(data[index])

        if (!result.ok) {
          ok = false
          errors.push(
            ...joinErrors(
              `Found error at index ${index} of array: `,
              result.errors
            )
          )
        } else {
          value.push(result.value)
        }
      }

      if (this.tupleRest) {
        for (
          let index = this.tupleItems.length;
          index < data.length;
          index++
        ) {}
      } else if (data.length > this.tupleItems.length) {
        return {
          ok: false,
          errors: errors.concat(
            `Found ${data.length} items; expected ${this.tupleItems.length}`
          ),
        }
      }

      return ok
        ? { ok, value: value as readonly unknown[] as T }
        : { ok, errors }
    },
  ] as any

  constructor(
    modifiers: readonly Modifier<any, any>[],
    protected readonly tupleItems: readonly AnyValidator[],
    protected readonly tupleRest?: AnyValidator
  ) {
    super(modifiers)
  }

  protected duplicate(newModifiers: readonly Modifier<any, any>[]): this {
    return new (this.constructor as typeof TupleValidator)(
      newModifiers,
      this.tupleItems,
      this.tupleRest
    ) as this
  }
}

export const tuple = <T extends readonly AnyValidator[]>(...tupleItems: T) =>
  new TupleValidator<{ readonly [K in keyof T]: Infer<T[K]> }>([], tupleItems)

class ObjectValidator<T extends object = {}> extends Validator<T> {
  protected readonly core = [
    refine(
      (data): data is object => typeof data == "object",
      `Expected an object.`
    ),
    transform((data: object) => ({ ...data })),
  ] as any

  shape<U extends Record<string, AnyValidator>>(
    shape: U
  ): ObjectValidator<{ readonly [K in keyof U]: Infer<U[K]> }> {
    return this.chain<{ readonly [K in keyof U]: Infer<U[K]> }>((data) => {
      let ok = true
      const errors = []
      const value: { [K in keyof U]: Infer<U[K]> } = Object.create(null)

      for (const key in shape) {
        const dataAtKey = data[key as Extract<keyof U, string> & keyof T]

        const result = shape[key].parse(dataAtKey)

        if (!result.ok) {
          ok = false

          if (typeof dataAtKey == "undefined") {
            errors.push(`Missing required key ${key}.`)
          } else {
            errors.push(...result.errors)
          }
        } else {
          value[key] = result.value
        }
      }

      return ok ? { ok, value } : { ok, errors }
    }) as any
  }
}

export const object = new ObjectValidator([])

export const lazy = <T>(getter: () => Validator<T>): Validator<T> => {
  let validator: Validator<T> | undefined

  return new Validator<T>([
    (value) => {
      if (!validator) {
        validator = getter()
      }

      return validator.parse(value)
    },
  ])
}
