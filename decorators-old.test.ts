// A class that unwraps its value, whether it be a signal or plain value. Used
// to test `decorators`.

import { computed } from "./decorators-old.js"

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
