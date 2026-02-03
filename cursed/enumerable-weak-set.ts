// An enumerable WeakSet created using WeakRefs.

export class WeakSet<T extends object> implements Set<T> {
    #set = new Set<WeakRef<T>>()

    #registry = new FinalizationRegistry<WeakRef<T>>((heldValue) => {
        this.#set.delete(heldValue)
    })

    #find(value: T): WeakRef<T> | undefined {
        for (const ref of this.#set) {
            if (ref.deref() === value) {
                return ref
            }
        }
    }

    add(value: T): this {
        if (this.has(value)) {
            return this
        }

        const ref = new WeakRef(value)

        this.#set.add(ref)

        this.#registry.register(value, ref, ref)

        return this
    }

    clear(): void {
        this.#set.forEach((ref) => {
            this.#registry.unregister(ref)
        })

        this.#set.clear()
    }

    delete(value: T): boolean {
        const ref = this.#find(value)

        if (ref === void 0) {
            return false
        }

        this.#registry.unregister(ref)

        this.#set.delete(ref)

        return true
    }

    forEach(
        callbackfn: (value: T, value2: T, set: WeakSet<T>) => void,
        thisArg?: any,
    ): void {
        for (const ref of this.#set) {
            const value = ref.deref()

            if (value !== void 0) {
                callbackfn.call(thisArg, value, value, this)
            }
        }
    }

    has(value: T): boolean {
        return this.#find(value) !== undefined
    }

    get size(): number {
        let size = 0

        for (const ref of this.#set) {
            if (ref.deref() !== undefined) {
                size++
            }
        }

        return size
    }

    *entries(): IterableIterator<[T, T]> {
        for (const ref of this.#set) {
            const value = ref.deref()

            if (value !== undefined) {
                yield [value, value]
            }
        }
    }

    *keys(): IterableIterator<T> {
        for (const ref of this.#set) {
            const value = ref.deref()

            if (value !== undefined) {
                yield value
            }
        }
    }

    *values(): IterableIterator<T> {
        for (const ref of this.#set) {
            const value = ref.deref()

            if (value !== undefined) {
                yield value
            }
        }
    }

    *[Symbol.iterator](): IterableIterator<T> {
        for (const ref of this.#set) {
            const value = ref.deref()

            if (value !== undefined) {
                yield value
            }
        }
    }

    [Symbol.toStringTag] = "Set"
}
