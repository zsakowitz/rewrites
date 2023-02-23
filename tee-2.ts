// Tees an iterable into two iterables while keeping memory costs low. OOP style.

export class Tee<T> {
  #iterator: Iterator<T>
  #isDone = false

  #a
  #b

  get a() {
    return this.#a
  }

  get b() {
    return this.#b
  }

  constructor(iterable: Iterable<T>) {
    this.#iterator = iterable[Symbol.iterator]()

    const aQueue: T[] = []
    const bQueue: T[] = []

    this.#a = this.#teePart(aQueue, bQueue)
    this.#b = this.#teePart(bQueue, aQueue)
  }

  *#teePart(myQueue: T[], otherQueue: T[]) {
    while (true) {
      if (myQueue.length != 0) {
        yield myQueue.shift()!
        continue
      }

      if (this.#isDone) {
        return
      }

      const result = this.#iterator.next()

      if (result.done) {
        this.#isDone = true
        return
      }

      otherQueue.push(result.value)
      yield result.value
    }
  }
}
