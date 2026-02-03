// Tees an iterable into two iterables while keeping memory costs low.
// Functional style.

export function tee<T>(iterable: Iterable<T>): [Generator<T>, Generator<T>] {
    const iterator = iterable[Symbol.iterator]()
    let isDone = false

    const aQueue: T[] = []
    const bQueue: T[] = []

    function* teePart(myQueue: T[], otherQueue: T[]) {
        while (true) {
            if (myQueue.length != 0) {
                yield myQueue.shift()!
                continue
            }

            if (isDone) {
                return
            }

            const result = iterator.next()

            if (result.done) {
                isDone = true
                return
            }

            otherQueue.push(result.value)
            yield result.value
        }
    }

    return [teePart(aQueue, bQueue), teePart(bQueue, aQueue)]
}
