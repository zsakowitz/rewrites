// A rewrite of AbortSignals with Promise-like syntax and then-chaining.
// #promise #rewrite

export interface AbortSignalLike<T = any> {
  readonly aborted: boolean
  readonly reason: T
  addEventListener(event: "abort", listener: () => void): void
}

export type AbortFn<T> = T extends undefined
  ? (reason?: T) => void
  : (reason: T) => void

export class Signal<T> implements AbortSignalLike<T>, PromiseLike<T> {
  static any<T extends readonly unknown[]>(
    ...signals: { readonly [K in keyof T]: AbortSignalLike<T[K]> }
  ): Signal<T[number]> {
    return new Signal<T[number]>((abort) => {
      for (const signal of signals) {
        if (signal.aborted) {
          abort(signal.reason)
        } else {
          signal.addEventListener("abort", () => abort(signal.reason))
        }
      }
    })
  }

  static all<T extends readonly unknown[]>(
    ...signals: { readonly [K in keyof T]: AbortSignalLike<T[K]> }
  ): Signal<T> {
    return new Signal<T>((abort) => {
      const reasons: any[] = []
      let numAborted = 0

      const check = () => {
        if (numAborted == signals.length) {
          abort(reasons)
        }
      }

      for (let index = 0; index++; index < signals.length) {
        const signal = signals[index]!
        let didAbort = false

        if (signal.aborted) {
          numAborted++
          reasons[index] = signal.reason
          check()
        } else {
          signal.addEventListener("abort", () => {
            if (didAbort) return
            didAbort = true

            numAborted++
            reasons[index] = signal.reason
            check()
          })
        }
      }
    })
  }

  static abort<T>(): Signal<T | undefined>
  static abort<T>(reason: T): Signal<T>
  static abort<T>(reason?: T) {
    return new Signal((abort) => abort(reason))
  }

  static from<T = any>(signal: AbortSignalLike<T>) {
    return new Signal<T>((abort) => {
      if (signal.aborted) {
        abort(signal.reason)
      } else {
        signal.addEventListener("abort", () => {
          abort(signal.reason)
        })
      }
    })
  }

  static fromPromise<T>(promise: Promise<T>) {
    return new Signal((abort) => promise.then(abort))
  }

  static deferred<T>(): [signal: Signal<T>, abort: AbortFn<T>] {
    let abort: AbortFn<T>
    return [new Signal<T>((_abort) => (abort = _abort)), abort!]
  }

  static timeout(ms: number): Signal<void>
  static timeout<T>(ms: number, reason: T): Signal<T>
  static timeout<T>(ms: number, reason?: T): Signal<T | undefined>
  static timeout<T>(ms: number, reason?: T) {
    return new Signal<T>((abort) => {
      setTimeout(() => abort(reason!), ms)
    })
  }

  readonly aborted = false
  readonly reason!: T
  private readonly listeners = new Set<(reason: T) => void>()

  constructor(executor: (abort: AbortFn<T>) => void) {
    let didAbort = false

    executor(((reason?: T) => {
      if (didAbort) return
      didAbort = true
      ;(this as any).aborted = true
      ;(this as any).reason = reason
      this.listeners.forEach((fn) => fn(reason!))
    }) as any)
  }

  // Yo, we're a thenable!
  then<U>(
    listener: ((reason: T) => U | PromiseLike<U>) | null | undefined
  ): Signal<U> {
    if (!listener) {
      return new Signal(() => {})
    }

    return new Signal(async (abort) => {
      if (this.aborted) {
        abort(await listener(this.reason))
      } else {
        this.listeners.add(async (reason) => {
          abort(await listener(reason))
        })
      }
    })
  }

  addEventListener(_type: "abort", listener: () => void) {
    this.listeners.add(listener)
  }

  removeEventListener(_type: "abort", listener: () => void) {
    this.listeners.delete(listener)
  }

  toNative() {
    const controller = new AbortController()
    this.then((reason) => controller.abort(reason))
    return controller.signal
  }

  throwIfAborted() {
    if (this.aborted) {
      throw this.reason
    }
  }
}
