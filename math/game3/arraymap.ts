interface Entry<K, T extends {}> {
  children: Map<K, Entry<K, T>>
  value: T | null
}

export class ArrayMap<K, T extends {}> {
  #root: Entry<K, T> = {
    children: new Map(),
    value: null,
  }

  #entry(key: readonly K[]): Entry<K, T> {
    let ret = this.#root
    for (let i = 0; i < key.length; i++) {
      const segment = key[i]!
      if (ret.children.has(segment)) {
        ret = ret.children.get(segment)!
      } else {
        ret.children.set(segment, (ret = { children: new Map(), value: null }))
      }
    }
    return ret
  }

  get(key: readonly K[]) {
    return this.#entry(key).value
  }

  set(key: readonly K[], value: T) {
    this.#entry(key).value = value
  }
}
