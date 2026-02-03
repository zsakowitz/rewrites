// An async generator that yields queued values.

export class Queue<T> {
    #queue: T[] = []
    #waiters: (() => void)[] = []

    queue(value: T) {
        this.#queue.push(value)
        this.#waiters.forEach((fn) => fn())
        this.#waiters.length = 0
    }

    async *[Symbol.asyncIterator](): AsyncGenerator<T, never, unknown> {
        let index = 0

        while (true) {
            for (; index < this.#queue.length; index++) {
                yield this.#queue[index]!
            }

            await new Promise<void>((resolve) => this.#waiters.push(resolve))
        }
    }
}
