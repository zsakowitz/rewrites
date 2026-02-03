// A lock that can only be used by one activity at a time.

if (!globalThis.queueMicrotask) {
    globalThis.queueMicrotask = (fn) => {
        Promise.resolve().then(fn)
    }
}

export class Lock {
    #isLocked = false
    readonly #queue: (() => void)[] = []

    async #forceRun(fn: (release: () => void) => void | PromiseLike<void>) {
        this.#isLocked = true
        let wasReleased = false

        try {
            await fn(() => {
                if (wasReleased) {
                    return
                }

                this.#isLocked = false
                this.#runNextQueued()
            })
        } finally {
            if (!wasReleased) {
                this.#isLocked = false
                this.#runNextQueued()
            }
        }
    }

    async #runNextQueued() {
        queueMicrotask(() => {
            const queuedFn = this.#queue.shift()

            if (queuedFn) {
                queuedFn()
            }
        })
    }

    async run(fn: (release: () => void) => void | PromiseLike<void>) {
        if (this.#isLocked) {
            this.#queue.push(() => this.#forceRun(fn))
        } else {
            this.#forceRun(fn)
        }
    }
}
