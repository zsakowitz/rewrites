// A simple lock that only allows one function to acquire it at a time.

export class Lock {
  #queue: (() => Promise<unknown>)[] = []
  #isLocked = false

  async #runNext() {
    if (this.#isLocked) {
      return
    }

    this.#isLocked = true

    const next = this.#queue.shift()

    if (!next) {
      return
    }

    try {
      await next()
    } finally {
      this.#isLocked = false
      this.#runNext()
    }
  }

  run<T = void>(fn: () => T | PromiseLike<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => Promise.resolve(fn()).then(resolve, reject))
      this.#runNext()
    })
  }
}
