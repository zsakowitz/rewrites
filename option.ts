// An Option monad.

export class Option<T> {
  static from<T>(optionLike: { ok: boolean; value?: T }): Option<T> {
    if (optionLike.ok) {
      return Option.some(optionLike.value!)
    } else {
      return Option.none()
    }
  }

  static some<T>(value: T): Option<T> {
    return new Option(true, value)
  }

  static none(): Option<never> {
    return new Option(false)
  }

  private constructor(
    private readonly ok: boolean,
    private readonly value?: T
  ) {}

  map<U>(fn: (value: T) => U): Option<U> {
    if (this.ok) {
      return Option.some(fn(this.value!))
    } else {
      return Option.none()
    }
  }

  flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
    if (this.ok) {
      return fn(this.value!)
    } else {
      return Option.none()
    }
  }

  handle<U>(handler: { some(value: T): U; none(): U }): U {
    if (this.ok) {
      return handler.some(this.value!)
    } else {
      return handler.none()
    }
  }
}
