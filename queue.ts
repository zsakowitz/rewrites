// An async generator that yields queued values.

if (!globalThis.queueMicrotask) {
  globalThis.queueMicrotask = (fn) => {
    Promise.resolve().then(fn)
  }
}

export class Queue<T> {
  #queue: T[] = []
  #waiters: (() => void)[] = []

  queue(value: T) {
    queueMicrotask(() => {
      this.#queue.push(value)
      this.#waiters.forEach((fn) => fn())
    })
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, unknown> {
    let index = 0

    while (true) {
      for (; index < this.#queue.length; index++) {
        yield this.#queue[index]
      }

      await new Promise<void>((resolve) => this.#waiters.push(resolve))
    }
  }
}
