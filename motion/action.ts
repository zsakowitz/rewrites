// An action type and helpers for Motion.

export type Action = Iterable<undefined>
export type ActionIterator = Iterator<undefined>

/**
 * Merges several actions into a concurrent one.
 *
 * @param actions - The actions to merge.
 */
export function* all(...actions: Action[]): Action {
    const iterators = actions.map<ActionIterator>((x) => x[Symbol.iterator]())

    while (iterators.length) {
        for (let index = 0; index < iterators.length; index++) {
            const result = iterators[index]!.next()

            if (result.done) {
                iterators.splice(index, 1)
                index--
            }
        }

        yield
    }
}

/**
 * Runs several actions concurrently, exiting after one of them completes.
 *
 * @param actions - The actions to run.
 */
export function* any(...actions: Action[]): Action {
    const iterators = actions.map<ActionIterator>((x) => x[Symbol.iterator]())

    while (iterators.length) {
        for (let index = 0; index < iterators.length; index++) {
            const result = iterators[index]!.next()

            if (result.done) {
                iterators.splice(index, 1)
                iterators.forEach((x) => x.return?.())
                return
            }
        }

        yield
    }
}

/**
 * Waits for a specified number of frames.
 *
 * @param frames - The number of frames to wait.
 */
export function* delay(frames: number): Action {
    for (let frame = 0; frame < frames; frame++) {
        yield
    }
}
