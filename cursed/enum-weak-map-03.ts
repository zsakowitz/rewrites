export class EnumWeakMap<K extends WeakKey, V> implements Map<K, V> {
  #map = new WeakMap<K, V>()
  #ref = new WeakMap<K, WeakRef<K>>()
  #set = new Set<WeakRef<K>>()

  set(key: K, value: V) {
    let ref = this.#ref.get(key)
    if (!ref) {
      ref = new WeakRef(key)
      this.#ref.set(key, ref)
    }
    this.#map.set(key, value)
    this.#set.add(ref)
    return this
  }

  get(key: K) {
    return this.#map.get(key)
  }

  get size() {
    return this.#set.size
  }

  clear(): void {
    this.#map = new WeakMap()
    this.#ref = new WeakMap()
    this.#set.clear()
  }

  delete(key: K): boolean {
    const ref = this.#ref.get(key)
    if (ref) {
      this.#set.delete(ref)
      this.#map.delete(key)
      return true
    } else {
      return this.#map.delete(key)
    }
  }

  has(key: K): boolean {
    return this.#map.has(key)
  }

  *[Symbol.iterator]() {
    for (const ref of this.#set) {
      const key = ref.deref()
      if (key && this.#map.has(key)) {
        yield [key, this.#map.get(key)!] satisfies [K, V] as [K, V]
      }
    }
  }

  *keys() {
    for (const [k] of this) {
      yield k
    }
  }

  *values() {
    for (const [, v] of this) {
      yield v
    }
  }

  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any,
  ): void {
    for (const [k, v] of this) {
      callbackfn.call(thisArg, v, k, this)
    }
  }

  entries(): IterableIterator<[K, V]> {
    return this[Symbol.iterator]()
  }

  [Symbol.toStringTag] = "map"
}
