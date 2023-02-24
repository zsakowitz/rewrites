import { executeSubscriber } from "./execute-subscriber"
import { getAsyncIterator } from "./get-async-iterator"
import { getIterator } from "./get-iterator"
import { getMethod } from "./get-method"
import { hostReportError } from "./host-report-error"
import { throwTypeError } from "./throw-type-error"
;(Symbol as any).observable = Symbol.observable || Symbol("Symbol.observable")

export interface Observer<in T> {
  start?(subscription: Subscription): void
  next?(value: T): void
  error?(reason: unknown): void
  complete?(value: unknown): void
}

export type SubscriberFunction<out T> = (
  observer: SubscriptionObserver<T>
) => void | (() => void) | Subscription

export class Observable<out T> {
  static from<T>(
    x:
      | { [Symbol.observable](): Observable<T> }
      | { [Symbol.iterator](): Iterator<T> }
      | {
          [Symbol.asyncIterator]():
            | AsyncIterator<T | PromiseLike<T>>
            | Iterator<T | PromiseLike<T>>
        }
  ): Observable<T> {
    let C = this

    if (typeof C != "function") {
      C = Observable
    }

    const observableMethod = getMethod(x, Symbol.observable)

    if (observableMethod) {
      const observable = observableMethod.call(x)

      if (
        (typeof observable != "object" && typeof observable != "function") ||
        !observable
      ) {
        throwTypeError("object", observable)
      }

      if (observable.constructor === C) {
        return observable
      }

      return new C((observer) => observable.subscribe(observer))
    } else if (Symbol.iterator in x) {
      const iterator = getIterator<T>(x)

      const iterable = { [Symbol.iterator]: () => iterator }

      return new C((observer) => {
        for (const item of iterable) {
          observer.next(item)
        }

        observer.complete(undefined)
      })
    } else if (Symbol.asyncIterator in x) {
      const iterator = getAsyncIterator<T>(x)

      const iterable = { [Symbol.asyncIterator]: () => iterator }

      return new C((observer) => {
        ;(async () => {
          for await (const item of iterable) {
            observer.next(item)
          }

          observer.complete(undefined)
        })()
      })
    }

    throwTypeError("observable, iterator, or async iterator", x)
  }

  static of<T>(...items: readonly T[]): Observable<T> {
    let C = this

    if (typeof C != "function") {
      C = Observable
    }

    return new C((observer: SubscriptionObserver<T>) => {
      for (const element of items) {
        observer.next(element)
      }

      observer.complete(undefined)
    })
  }

  readonly #subscriber: SubscriberFunction<T>

  constructor(subscriber: SubscriberFunction<T>) {
    if (typeof subscriber != "function") {
      throwTypeError("function", subscriber)
    }

    this.#subscriber = subscriber
  }

  subscribe(observer: Observer<T>): Subscription

  subscribe(
    onNext: (value: T) => void,
    onError?: (reason: unknown) => void,
    onComplete?: (value: unknown) => void
  ): Subscription

  subscribe(
    observer: Observer<T> | ((value: T) => void),
    onError: ((reason: unknown) => void) | undefined = undefined,
    onComplete: ((value: unknown) => void) | undefined = undefined
  ): Subscription {
    const O = this

    if (!(#subscriber in O)) {
      throwTypeError("Observer", O)
    }

    if (typeof observer == "function") {
      observer = {
        next: observer,
        error: onError,
        complete: onComplete,
      }
    } else if (typeof observer != "object" || !observer) {
      throwTypeError("observer or function", observer)
    }

    const subscription = new Subscription(observer)

    try {
      var start = getMethod(observer, "start")
    } catch (error) {
      hostReportError(error)
    }

    if (typeof start != "undefined") {
      if (typeof start != "function") {
        throwTypeError("function", start)
      }

      try {
        var result = start.call(observer, subscription)
      } catch (error) {
        hostReportError(error)
      }

      if (subscription.closed) {
        return subscription
      }
    }

    const subscriptionObserver = new SubscriptionObserver(subscription)

    const subscriber = O.#subscriber

    try {
      var subscriberResult = executeSubscriber(subscriber, subscriptionObserver)
    } catch (error) {
      subscriptionObserver.error(error)
    }

    setSubscriptionCleanup(subscription, subscriberResult)

    if (subscription.closed) {
      cleanupSubscription(subscription)
    }

    return subscription
  }

  [Symbol.observable](): this {
    return this
  }

  map<U>(mapFn: (value: T) => U): Observable<U> {
    return new Observable<U>((observer) => {
      return this.subscribe({
        next(value) {
          observer.next(mapFn(value))
        },
        error(reason) {
          observer.error(reason)
        },
        complete(value) {
          observer.complete(value)
        },
      })
    })
  }

  filter<U extends T>(filterFn: (value: T) => value is U): Observable<U>
  filter(filterFn: (value: T) => boolean): Observable<T>
  filter(filterFn: (value: T) => boolean): Observable<T> {
    return new Observable<T>((observer) => {
      return this.subscribe({
        next(value) {
          if (filterFn(value)) {
            observer.next(value)
          }
        },
        error(reason) {
          observer.error(reason)
        },
        complete(value) {
          observer.complete(value)
        },
      })
    })
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    let wake = () => {}
    const queued: T[] = []

    let didError = false
    let errorValue: unknown
    let didComplete = false
    let completeValue: unknown

    this.subscribe({
      next(value) {
        if (didError || didComplete) return

        queued.push(value)

        wake()
      },
      error(reason) {
        if (didError || didComplete) return

        didError = true
        errorValue = reason

        wake()
      },
      complete(value) {
        if (didError || didComplete) return

        didComplete = true
        completeValue = value

        wake()
      },
    })

    while (true) {
      yield* queued satisfies T[] as any
      queued.length = 0

      if (didError) {
        throw errorValue
      }

      if (didComplete) {
        return completeValue
      }

      await new Promise<void>((resolve) => (wake = resolve))
    }
  }
}

let setSubscriptionCleanup: (
  value: Subscription,
  cleanup: (() => void) | undefined
) => void

let cleanupSubscription: (subscription: Subscription) => void

let getSubscriptionObserver: (
  subscription: Subscription
) => Observer<unknown> | undefined

export class Subscription {
  static {
    setSubscriptionCleanup = (value, cleanup) => {
      value.#cleanup = cleanup
    }

    cleanupSubscription = (subscription) => {
      const cleanup = subscription.#cleanup

      if (typeof cleanup == "undefined") {
        return undefined
      }

      if (typeof cleanup != "function") {
        throwTypeError("function", cleanup)
      }

      subscription.#cleanup = undefined

      try {
        cleanup()
      } catch (error) {
        // If result is an abrupt completion, perform HostReportErrors(« result.[[Value]] »).
        hostReportError(error)
      }
    }

    getSubscriptionObserver = (subscription) => {
      return subscription.#observer
    }

    this.prototype.constructor = Object
  }

  #observer: Observer<unknown> | undefined
  #cleanup: (() => void) | undefined

  constructor(observer: Observer<any>) {
    this.#observer = observer
  }

  get closed(): boolean {
    const subscription = this

    if (!(#observer in subscription)) {
      throwTypeError("Subscription", subscription)
    }

    return typeof subscription.#observer == "undefined"
  }

  unsubscribe(): void {
    const subscription = this

    if (!(#observer in subscription)) {
      throwTypeError("Subscription", subscription)
    }

    if (subscription.closed) {
      return undefined
    }

    subscription.#observer = undefined

    cleanupSubscription(subscription)
  }
}

export class SubscriptionObserver<in T> {
  #subscription: Subscription

  static {
    this.prototype.constructor = Object
  }

  constructor(subscription: Subscription) {
    this.#subscription = subscription
  }

  get closed(): boolean {
    const O = this

    if (!(#subscription in O)) {
      throwTypeError("SubscriptionObserver", O)
    }

    const subscription = O.#subscription

    return subscription.closed
  }

  next(value: T): void {
    const O = this

    if (!(#subscription in O)) {
      throwTypeError("SubscriptionObserver", O)
    }

    const subscription = O.#subscription

    if (subscription.closed) {
      return undefined
    }

    const observer = getSubscriptionObserver(subscription)

    const nextMethod = getMethod(observer, "next")

    if (typeof nextMethod != "undefined") {
      if (typeof nextMethod != "function") {
        throwTypeError("function", nextMethod)
      }

      try {
        return nextMethod.call(observer, value)
      } catch (error) {
        subscription.unsubscribe()
        throw error
      }
    }
  }

  error(exception: unknown): void {
    const subscription = this.#subscription

    if (subscription.closed) {
      throw exception
    }

    const observer = getSubscriptionObserver(subscription)

    subscription.unsubscribe()

    const errorMethod = getMethod(observer, "error")

    if (typeof errorMethod == "undefined") {
      throw exception
    }

    return errorMethod.call(observer, exception)
  }

  complete(value: unknown): void {
    const subscription = this.#subscription

    if (subscription.closed) {
      return
    }

    const observer = getSubscriptionObserver(subscription)

    subscription.unsubscribe()

    const completeMethod = getMethod(observer, "complete")

    if (typeof completeMethod != "undefined") {
      return completeMethod.call(observer, value)
    }
  }
}

declare global {
  interface SymbolConstructor {
    readonly observable: unique symbol
  }
}
