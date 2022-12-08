// A class that stores private data.

const data = new WeakMap<PrivateData<any, any>, WeakMap<any, any>>()

export class PrivateData<K = unknown, V = unknown> {
  constructor() {
    data.set(this, new WeakMap())
  }

  get(key: K): V {
    return data.get(this)?.get(key)
  }

  set(key: K, value: V): this {
    data.get(this)?.set(key, value)

    return this
  }

  has(key: K): boolean {
    return data.get(this)?.has(key) || false
  }

  delete(key: K): this {
    data.get(this)?.delete(key)

    return this
  }
}
