// An enumerable WeakMap. Pretty much the wrong data structure for everything.

export class EnumWeakMap<K extends WeakKey, V> {
    #refs = new WeakMap<K, WeakRef<K>>()
    #map = new Map<WeakRef<K>, V>()

    #registry = new FinalizationRegistry((heldValue: WeakRef<K>) => {
        this.#map.delete(heldValue)
    })

    set(key: K, value: V) {
        let ref = this.#refs.get(key)
        if (!ref) {
            ref = new WeakRef(key)
            this.#registry.register(key, ref, ref)
            this.#refs.set(key, ref)
        }
        this.#map.set(ref, value)
    }

    get(key: K): V | undefined {
        const ref = this.#refs.get(key)
        if (ref) {
            return this.#map.get(ref)
        }
    }

    has(key: K): boolean {
        const ref = this.#refs.get(key)
        return !!ref && this.#map.has(ref)
    }

    delete(key: K): boolean {
        const ref = this.#refs.get(key)
        if (ref) {
            this.#refs.delete(key)
            this.#registry.unregister(ref)
            return this.#map.delete(ref)
        }
        return this.#refs.delete(key)
    }

    *[Symbol.iterator]() {
        for (const [ref, value] of this.#map) {
            const v = ref.deref()
            if (v) {
                yield [v, value]
            } else {
                this.#map.delete(ref)
            }
        }
    }
}
