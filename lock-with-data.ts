// A lock that stores some data. Its data can only be read and written to during
// an exclusive operation.

import { Lock } from "./lock-2"

export class DataLock<T> {
  #data: T
  readonly #lock = new Lock()

  constructor(data: T) {
    this.#data = data
  }

  async run(fn: (data: T) => T | PromiseLike<T>) {
    await this.#lock.run(async () => {
      this.#data = await fn(this.#data)
    })
  }
}
