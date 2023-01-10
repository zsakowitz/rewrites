// An exploration into various monads. Unfinished.

export class Maybe<T> {
  #ok: boolean
  #data!: T

  static Just<T>(value: T): Maybe<T> {
    return new Maybe(true, value)
  }

  static None = new Maybe<never>(false)

  private constructor(ok: boolean, data?: T) {
    this.#ok = ok
    this.#data = data!
  }

  bind<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    if (this.#ok) {
      return fn(this.#data)
    } else {
      return Maybe.None
    }
  }
}
