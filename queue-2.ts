// Another async generator that yields queued values.

const noop = () => {}

export function createQueue<T>(): [
    enqueue: (value: T) => void,
    queue: AsyncGenerator<T>,
] {
    let wake = noop
    const queued: T[] = []

    function enqueue(value: T) {
        queued.push(value)
        wake()
    }

    return [
        enqueue,
        (async function* () {
            while (true) {
                yield* queued
                queued.length = 0
                await new Promise<void>((resolve) => (wake = resolve))
            }
        })(),
    ]
}
