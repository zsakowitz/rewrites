// `Action` type and helpers such as `all` and `sequence` for Animator.

export type Action = Iterable<undefined>

export type ActionIterator = Iterator<undefined>

function toIterator(action: Action): ActionIterator {
    return action[Symbol.iterator]()
}

export function* sequence(...actions: Action[]): Action {
    for (const action of actions) {
        yield* action
    }
}

export function* all(...actions: Action[]): Action {
    const iterators = actions.map(toIterator)

    while (iterators.length) {
        for (let index = 0; index < iterators.length; index++) {
            const result = iterators[index]!.next()

            if (result.done) {
                iterators.splice(index, 1)
                index--
            }
        }

        if (iterators.length) {
            yield
        }
    }
}
