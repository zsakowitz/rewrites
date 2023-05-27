// An implementation of the Iterator Helpers proposal. #iterator #rewrite

export class Iterator<T, TReturn = any, TNext = undefined>
  implements globalThis.Iterator<T, TReturn, TNext>
{
  next: (...args: [] | [TNext]) => IteratorResult<T, TReturn>
  return?: (value?: TReturn) => IteratorResult<T, TReturn>
  throw?: (e?: any) => IteratorResult<T, TReturn>

  constructor(iterator: globalThis.Iterator<T, TReturn, TNext>) {
    this.next = iterator.next.bind(iterator)
    this.return = iterator.return?.bind(iterator)
    this.throw = iterator.throw?.bind(iterator)
  }

  [Symbol.iterator]() {
    return this
  }

  *take(count: number): Generator<T, TReturn | undefined, TNext> {
    let sent: TNext | undefined

    for (let i = 0; i < count; i++) {
      const { value, done } = this.next(sent!)
      if (done) return value
      sent = yield value
    }
  }

  drop(count: number): Iterator<T, TReturn, TNext> {
    for (let i = 0; i < count; i++) {
      const { done } = this.next()
      if (done) return this
    }

    return this
  }

  *map<U>(fn: (value: T) => U): Generator<U, TReturn, TNext> {
    let sent: TNext | undefined

    while (true) {
      const { value, done } = this.next(sent!)
      if (done) return value
      yield fn(value)
    }
  }

  *filter(fn: (value: T) => unknown): Generator<T, TReturn, TNext> {
    let sent: TNext | undefined

    while (true) {
      const { value, done } = this.next(sent!)
      if (done) return value
      if (fn(value)) sent = yield value
    }
  }

  some(fn: (value: T) => unknown): boolean {
    while (true) {
      const { value, done } = this.next()
      if (done) return false
      if (fn(value)) return true
    }
  }

  every(fn: (value: T) => unknown): boolean {
    while (true) {
      const { value, done } = this.next()
      if (done) return true
      if (!fn(value)) return false
    }
  }

  forEach(fn: (value: T) => void): void {
    while (true) {
      const { value, done } = this.next()
      if (done) return
      fn(value)
    }
  }

  reduce(fn: (oldValue: T, value: T) => T): T
  reduce<U>(fn: (oldValue: U, value: T) => U, initialValue?: U): U
  reduce<U>(fn: (oldValue: U, value: T) => U, initialValue?: U): U {
    if (initialValue === undefined) {
      const { value, done } = this.next()

      if (done) {
        throw new Error(
          "When initialValue is not passed, the underlying iterator must have at least one element.",
        )
      }

      initialValue = value as any
    }

    while (true) {
      const { value, done } = this.next()
      if (done) return initialValue!
      initialValue = fn(initialValue!, value)
    }
  }
}
