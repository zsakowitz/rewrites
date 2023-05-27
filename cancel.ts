// A signal that can be used to cancel things.

export type CancelSignalLike =
  | Promise<unknown>
  | AbortSignal
  | CancelSignal
  | {
      readonly aborted: boolean
      readonly reason?: any
      addEventListener(type: "abort", listener: () => void): void
    }

export class CancelSignal {
  static deferred(): [signal: CancelSignal, cancel: (reason?: any) => void] {
    let cancel!: (reason?: any) => void
    return [new CancelSignal((_cancel) => (cancel = _cancel)), cancel]
  }

  static from(item: CancelSignalLike) {
    if (item instanceof Promise) {
      return new CancelSignal((cancel) => {
        item.then(cancel)
      })
    } else {
      return new CancelSignal((cancel) => {
        if (item.aborted) {
          cancel(item.reason)
        } else {
          item.addEventListener("abort", () => cancel(item.reason))
        }
      })
    }
  }

  static timeout(ms: number) {
    return new CancelSignal((cancel) => setTimeout(cancel, ms))
  }

  #isCanceled = false
  #reason: unknown
  readonly #promise: Promise<unknown>

  constructor(executor: (cancel: (reason?: unknown) => void) => void) {
    this.#promise = new Promise((resolve) => {
      executor((reason) => {
        if (this.#isCanceled) {
          return
        }

        this.#isCanceled = true
        this.#reason = reason
        resolve(reason)
      })
    })
  }

  get aborted() {
    return this.#isCanceled
  }

  get canceled() {
    return this.#isCanceled
  }

  get reason() {
    return this.#reason
  }

  addEventListener(
    type: "abort",
    oncanceled: ((reason: unknown) => unknown) | null | undefined,
  ) {
    this.then(oncanceled)
  }

  then<T>(
    oncanceled: ((reason: unknown) => T) | null | undefined,
  ): CancelSignal {
    return new CancelSignal((cancel) => {
      this.#promise.then(oncanceled).then(cancel)
    })
  }

  toAbortSignal() {
    const controller = new AbortController()
    this.then((reason) => controller.abort(reason))
    return controller.signal
  }

  makeCancelable<T>(promise: PromiseLike<T>): Promise<
    | {
        canceled: true
        reason: unknown
        value?: undefined
      }
    | {
        canceled: false
        reason?: undefined
        value: T
      }
  > {
    return new Promise((resolve) => {
      promise.then((value) => resolve({ canceled: false, value }))
      this.then((reason) => resolve({ canceled: true, reason }))
    })
  }
}
