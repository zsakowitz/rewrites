export type EventMap = { [x: keyof any]: unknown[] }

const isOnce = new WeakSet()

export class EventTarget<T extends EventMap> {
  private listeners = new Map<keyof T, ((...args: any) => unknown)[]>()

  on<K extends keyof T>(event: K, fn: (...args: T[K]) => unknown) {
    const callbacks = this.listeners.get(event)
    if (callbacks == null) {
      this.listeners.set(event, [fn])
      return
    }
    const index = callbacks.indexOf(fn)
    if (index == -1) {
      callbacks.push(fn)
    }
  }

  off<K extends keyof T>(event: K, fn: (...args: T[K]) => unknown) {
    isOnce.delete(fn)
    const callbacks = this.listeners.get(event)
    if (callbacks == null) {
      return
    }
    const index = callbacks.indexOf(fn)
    if (index != -1) {
      callbacks.splice(index, 1)
    }
  }

  once<K extends keyof T>(event: K, fn: (...args: T[K]) => unknown) {
    const callbacks = this.listeners.get(event)
    if (callbacks == null) {
      isOnce.add(fn)
      this.listeners.set(event, [fn])
      return
    }
    const index = callbacks.indexOf(fn)
    if (index == -1) {
      isOnce.add(fn)
      callbacks.push(fn)
    }
  }

  dispatch<K extends keyof T>(event: K, ...data: T[K]) {
    let errors: unknown[] = []
    this.listeners.get(event)?.forEach((x) => {
      try {
        x(...data)
      } catch (e) {
        errors.push(e)
      }
    })
    if (errors.length == 1) {
      throw errors[0]
    }
    if (errors.length > 1) {
      throw new AggregateError(errors)
    }
  }

  waitUntil<K extends keyof T>(event: K): Promise<T[K]> {
    return new Promise((resolve) => this.once(event, (...x) => resolve(x)))
  }

  loop<K extends keyof T>(event: K): AsyncGenerator<T[K]> {
    const queue: T[K][] = []
    let waiter: (() => void) | undefined
    const self = this
    this.on(event, enqueue)

    return (async function* () {
      try {
        while (true) {
          while (queue.length) {
            yield queue.shift()!
          }

          await new Promise<void>((resolve) => (waiter = resolve))
        }
      } finally {
        self.off(event, enqueue)
      }
    })()

    function enqueue(...values: T[K]) {
      queue.push(values)
      waiter?.()
      waiter = undefined
    }
  }
}
