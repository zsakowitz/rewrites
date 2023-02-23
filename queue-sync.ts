// A queue that holds values until they're ready to be released.

export class Queue<T> {
  #queue: T[] = []

  deplete(): T[] {
    const values = this.#queue.slice()
    this.#queue.length = 0
    return values
  }

  dequeue(): T | undefined {
    return this.#queue.shift()
  }

  enqueue(value: T) {
    this.#queue.push(value)
  }

  *[Symbol.iterator]() {
    while (this.#queue.length) {
      yield this.#queue.shift()!
    }
  }
}
