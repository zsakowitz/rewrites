import { computed } from "./decorators-old"

export class Unwrap<T> {
  readonly #signal: T | (() => T)

  constructor(signal: T | (() => T)) {
    this.#signal = signal
  }

  @computed
  get value(): T {
    if (typeof this.#signal == "function") {
      return (this.#signal as Function)() as T
    }

    return this.#signal as Exclude<T, Function>
  }
}
