export class Option<T> {
  static try<T>(fn: () => T): Option<T> {
    try {
      return new Option(fn())
    } catch {
      return new Option()
    }
  }

  static from<T>(fn: <U>(unwrap: Option<U>) => U) {}

  #ok: boolean
  #value!: T

  constructor()
  constructor(value: T)
  constructor(readonly value?: T) {
    if (arguments.length == 0) {
      this.#ok = false
    } else {
      this.#ok = true
      this.#value = value!
    }
  }

  unwrap(): T {
    if (this.#ok) {
      return this.#value
    } else {
      throw new TypeError("Attempted to unwrap empty Option.")
    }
  }

  expect(text: string) {
    if (this.#ok) {
      return this.#value
    } else {
      throw new TypeError(`Expected ${text}; found empty Option.`)
    }
  }

  unwrapOr(value: T): T {
    if (this.#ok) {
      return this.#value
    } else {
      return value
    }
  }

  map<U>(fn: (value: T) => U): Option<U> {
    if (this.#ok) {
      return new Option(fn(this.#value))
    } else {
      return new Option()
    }
  }

  flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
    if (this.#ok) {
      return fn(this.#value)
    } else {
      return new Option()
    }
  }
}
