// A strongly types event emitter that uses async generators.

import { Queue } from "./queue"

export class Emitter<T extends { [x: keyof any]: (data?: any) => void }> {
  #queues: { [K in keyof T]?: Queue<Parameters<T[K]>[0]> } = Object.create(null)

  emit<K extends keyof T>(type: K, ...data: Parameters<T[K]>) {
    const queue = (this.#queues[type] ??= new Queue())
    queue.queue(data[0])
  }

  on<K extends keyof T>(
    type: K
  ): AsyncGenerator<Parameters<T[K]>[0], void, unknown> {
    return (this.#queues[type] ??= new Queue())[Symbol.asyncIterator]()
  }

  async *map<K extends keyof T, U>(
    type: K,
    mapper: (value: Awaited<Parameters<T[K]>[0]>) => U
  ) {
    for await (const value of this.on(type)) {
      yield mapper(value)
    }
  }

  filter<K extends keyof T, U extends Awaited<Parameters<T[K]>[0]>>(
    type: K,
    filter: (value: Awaited<Parameters<T[K]>[0]>) => value is U
  ): AsyncGenerator<Awaited<Parameters<T[K]>[0]>, void, unknown>
  filter<K extends keyof T>(
    type: K,
    filter: (value: Awaited<Parameters<T[K]>[0]>) => boolean
  ): AsyncGenerator<Awaited<Parameters<T[K]>[0]>, void, unknown>
  async *filter<K extends keyof T>(
    type: K,
    filter: (value: Awaited<Parameters<T[K]>[0]>) => boolean
  ): AsyncGenerator<Awaited<Parameters<T[K]>[0]>, void, unknown> {
    for await (const value of this.on(type)) {
      if (filter(value)) {
        yield value
      }
    }
  }
}
