export class WeakValueMap<K, V extends object> {
  #map = new Map<K, WeakRef<V>>()

  #registry = new FinalizationRegistry<K>((heldValue) => {
    this.#map.delete(heldValue)
  })

  clear(): void {
    for (const [, ref] of this.#map) {
      const value = ref.deref()

      if (value) {
        this.#registry.unregister(value)
      }
    }

    this.#map.clear()
  }

  delete(key: K): boolean {
    const ref = this.#map.get(key)

    if (!ref) {
      return false
    }

    this.#map.delete(key)

    const value = ref.deref()

    if (value) {
      this.#registry.unregister(value)
    }

    return true
  }

  *entries(): IterableIterator<[K, V]> {
    for (const [key, ref] of this.#map.entries()) {
      const value = ref.deref()

      if (value) {
        yield [key, value]
      }
    }
  }

  forEach(
    callbackfn: (value: V, key: K, map: WeakValueMap<K, V>) => void,
    thisArg?: any
  ): void {
    for (const [key, ref] of this.#map.entries()) {
      const value = ref.deref()

      if (value) {
        callbackfn.call(thisArg, value, key, this)
      }
    }
  }

  get(key: K): V | undefined {
    return this.#map.get(key)?.deref()
  }

  has(key: K): boolean {
    return this.#map.get(key)?.deref() !== void 0
  }

  *keys(): IterableIterator<K> {
    for (const [key, ref] of this.#map.entries()) {
      const value = ref.deref()

      if (value) {
        yield key
      }
    }
  }

  set(key: K, value: V): this {
    this.#map.set(key, new WeakRef(value))
    this.#registry.register(value, key, value)
    return this
  }

  get size() {
    let size = 0

    for (const [, ref] of this.#map.entries()) {
      const value = ref.deref()

      if (value) {
        size++
      }
    }

    return size
  }

  *values(): IterableIterator<V> {
    for (const [, ref] of this.#map.entries()) {
      const value = ref.deref()

      if (value) {
        yield value
      }
    }
  }
}
