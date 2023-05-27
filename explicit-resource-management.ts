// An implementation of the ECMAScript Explicit Resource Management proposal.

export interface DisposableResource {
  [Symbol.dispose](): void
}

export interface AsyncDisposableResource {
  [Symbol.asyncDispose](): void
}

const dispose = ((Symbol as any).dispose ??= Symbol("Symbol.dispose"))

const asyncDispose = ((Symbol as any).asyncDispose ??= Symbol(
  "Symbol.asyncDispose",
))

let disposables: unknown[] | undefined

export function usingBlock<T>(fn: () => T): T {
  let value: T
  const oldDisposables = disposables
  const mustBeDisposed: unknown[] = (disposables = [])

  try {
    value = fn()
  } finally {
    disposables = oldDisposables
    const errors: unknown[] = []
    let shouldThrow = false

    for (const disposable of mustBeDisposed) {
      try {
        if (
          (typeof disposable != "object" && typeof disposable != "function") ||
          disposable == null
        ) {
          throw new TypeError(
            "A disposable was of an improper type: " + typeof disposable,
          )
        }

        const disposeFn: unknown = (disposable as any)[dispose]

        if (typeof disposeFn != "function") {
          throw new TypeError("A disposable is missing an @@dispose method.")
        }

        disposeFn.call(disposable)
      } catch (error) {
        errors.push(error)
      }
    }

    if (shouldThrow) {
      throw new AggregateError(errors)
    }
  }

  return value
}

export async function asyncUsingBlock<T>(fn: () => T): Promise<Awaited<T>> {
  let value: Awaited<T>
  const oldDisposables = disposables
  const mustBeDisposed: unknown[] = (disposables = [])

  try {
    value = await fn()
  } finally {
    disposables = oldDisposables
    const errors: unknown[] = []
    let shouldThrow = false

    for (const disposable of mustBeDisposed) {
      try {
        if (
          (typeof disposable != "object" && typeof disposable != "function") ||
          disposable == null
        ) {
          throw new TypeError(
            "A disposable was of an improper type: " + typeof disposable,
          )
        }

        const asyncDisposeFn: unknown = (disposable as any)[asyncDispose]

        if (typeof asyncDisposeFn == "function") {
          asyncDisposeFn.call(disposable)
        } else {
          const disposeFn: unknown = (disposable as any)[dispose]

          if (typeof disposeFn != "function") {
            throw new TypeError(
              "An async disposable is missing an @@asyncDispose or @@dispose method.",
            )
          }

          disposeFn.call(disposable)
        }
      } catch (error) {
        errors.push(error)
      }
    }

    if (shouldThrow) {
      throw new AggregateError(errors)
    }
  }

  return value
}

export function using<T extends DisposableResource | null | undefined>(
  disposable: T,
): T {
  if (!disposables) {
    throw new Error("Cannot call 'using' outside of a using {} block.")
  }

  disposables.push(disposable)
  return disposable
}

export function asyncUsing<
  T extends AsyncDisposableResource | DisposableResource | null | undefined,
>(disposable: T): T {
  if (!disposables) {
    throw new Error("Cannot call 'usingAsync' outside of a using {} block.")
  }

  disposables.push(disposable)
  return disposable
}

export class Disposable {
  static from(disposables: Iterable<DisposableResource | null | undefined>) {
    disposables = [...disposables]

    return new Disposable(() => {
      for (const disposable of disposables) {
        disposable?.[Symbol.dispose]()
      }
    })
  }

  #dispose: () => void

  constructor(dispose: () => void) {
    this.#dispose = dispose
  }

  [Symbol.dispose]() {
    this.#dispose()
  }
}

declare global {
  interface SymbolConstructor {
    readonly dispose: unique symbol
    readonly asyncDispose: unique symbol
  }
}
