// A library for creating Deferred objects. Compatible with the Promises A+
// specification. #promise #rewrite

type PendingState = { readonly type: "pending" }
type FulfilledState<T> = { readonly type: "fulfilled"; readonly value: T }
type RejectedState = { readonly type: "rejected"; readonly reason: any }
type ResolvedState<T> = FulfilledState<T> | RejectedState
type PromiseState<T> = ResolvedState<T> | PendingState

const microtask = globalThis.queueMicrotask || setTimeout

export class Deferred<T> {
  private state: PromiseState<T> = { type: "pending" }
  private queue: ((state: ResolvedState<T>) => void)[] = []
  promise = this

  private serve() {
    if (this.state.type == "pending") return

    while (this.queue.length) {
      let item = this.queue.shift()
      item?.(this.state)
    }
  }

  resolve(x: T | PromiseLike<T>) {
    if ((this as any) === x) {
      this.reject(
        new TypeError("The promise and value refer to the same object"),
      )
    } else if (x && (typeof x == "object" || typeof x == "function")) {
      let called = false

      try {
        let then = (x as any).then

        if (then && typeof then == "function") {
          then.call(
            x,
            (val: T | PromiseLike<T>) => {
              if (!called) {
                this.resolve(val)
                called = true
              }
            },
            (reason: any) => {
              if (!called) {
                this.reject(reason)
                called = true
              }
            },
          )
        } else {
          this.fulfill(x as T)
        }
      } catch (err) {
        if (!called) {
          this.reject(err)
        }
      }
    } else {
      this.fulfill(x as T)
    }
  }

  private fulfill(value: T) {
    if (this.state.type != "pending") return
    this.state = { type: "fulfilled", value }
    microtask(() => this.serve())
  }

  reject(reason?: any) {
    if (this.state.type != "pending") return
    this.state = { type: "rejected", reason }
    microtask(() => this.serve())
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Deferred<TResult1 | TResult2> {
    let deferred = new Deferred<TResult1 | TResult2>()

    this.queue.push((state) => {
      if (state.type == "fulfilled") {
        if (typeof onfulfilled == "function") {
          try {
            let result = onfulfilled(state.value)
            deferred.resolve(result)
          } catch (err) {
            deferred.reject(err)
          }
        } else {
          deferred.resolve(state.value as any)
        }
      } else if (state.type == "rejected") {
        if (typeof onrejected == "function") {
          try {
            let result = onrejected(state.reason)
            deferred.resolve(result)
          } catch (err) {
            deferred.reject(err)
          }
        } else {
          deferred.reject(state.reason)
        }
      }
    })

    if (this.state.type != "pending") {
      microtask(() => this.serve())
    }

    return deferred
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Deferred<T | TResult> {
    return this.then(null, onrejected)
  }

  finally(onfinally?: (() => void) | undefined | null) {
    return this.then<T, never>(
      (value) => {
        if (typeof onfinally == "function") onfinally()
        return value
      },
      (reason) => {
        if (typeof onfinally == "function") onfinally()
        throw reason
      },
    )
  }

  static resolve<T>(value: T | PromiseLike<T>): Deferred<T> {
    let deferred = new Deferred<T>()
    deferred.resolve(value)
    return deferred
  }

  static reject(reason?: any): Deferred<never> {
    let deferred = new Deferred<never>()
    deferred.reject(reason)
    return deferred
  }

  static wait(ms: number): Deferred<void> {
    let deferred = new Deferred<void>()
    setTimeout(() => deferred.resolve(), ms)
    return deferred
  }

  wait(ms: number): Deferred<T> {
    return this.finally(() => Deferred.wait(ms))
  }

  spread<TResult = void>(
    onfulfilled: (...value: T & any[]) => TResult | PromiseLike<T>,
  ): Deferred<T extends any[] ? TResult : T> {
    return this.then<T extends any[] ? TResult : T>((value) => {
      if (Array.isArray(value)) return onfulfilled(...(value as any)) as any
      else return value as any
    })
  }
}
