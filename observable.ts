// The [ES Observable](https://github.com/tc39/proposal-observable) proposal,
// implemented in standard JavaScript. Incomplete. #rewrite #proposal

import { runTests } from "es-observable-tests";

(Symbol as any).observable = Symbol.observable || Symbol("Symbol.observable");

export interface Observer<T> {
  start?(subscription: Subscription): void;
  next?(value: T): void;
  error?(reason?: unknown): void;
  complete?(): void;
}

export interface SubscriptionObserver<T> {
  next(value: T): void;
  error(reason?: unknown): void;
  complete(): void;
  readonly closed: boolean;
}

function getMethod<T, K extends keyof T & string>(
  object: T,
  key: K
): NonNullable<T[K] & Function> {
  const value = object[key];

  if (typeof value == "function") {
    return value;
  } else if (value == null) {
    return (() => {}) as any;
  } else {
    throw new TypeError(
      "The given object has an invalid `" + key + "` method."
    );
  }
}

export class Observable<T> {
  #onSubscribe: (
    observer: SubscriptionObserver<T>
  ) => undefined | Subscription | (() => void);

  constructor(
    onSubscribe: (
      observer: SubscriptionObserver<T>
    ) => undefined | Subscription | (() => void)
  ) {
    this.#onSubscribe = onSubscribe;
  }

  subscribe(observer: Observer<T>): Subscription;

  subscribe(
    next: Observer<T>["next"],
    error?: Observer<T>["error"],
    complete?: Observer<T>["complete"]
  ): Subscription;

  subscribe(
    observer: Observer<T> | Observer<T>["next"],
    error?: Observer<T>["error"],
    complete?: Observer<T>["complete"]
  ): Subscription {
    let closed = false;
    let next: Observer<T>["next"];

    if (typeof observer == "object") {
      if (error != null || complete != null) {
        throw new TypeError(
          "An observable may either be passed an observer OR next/error/complete functions, but not a mix."
        );
      }

      next = getMethod(observer, "next");
      error = getMethod(observer, "error");
      complete = getMethod(observer, "complete");
    } else if (typeof observer == "function") {
      if (!(typeof error == "function" || error == null)) {
        throw new TypeError("The `error` handler is of an invalid type.");
      }

      if (!(typeof complete == "function" || complete == null)) {
        throw new TypeError("The `complete` handler is of an invalid type.");
      }

      next = observer || (() => {});
      error = error || (() => {});
      complete = complete || (() => {});
    } else {
      throw new TypeError("The passed observer has an invalid type.");
    }

    const c = complete;
    const e = error;

    let close = this.#onSubscribe({
      next,
      complete() {
        closed = true;
        forceClose(subscription);
        c();
      },
      error(reason) {
        closed = true;
        forceClose(subscription);
        e(reason);
      },
      get closed() {
        return closed;
      },
    });

    if (close instanceof Subscription) {
      return close;
    } else if (close == null) {
      close = () => {};
    } else if (typeof close != "function") {
      throw new TypeError(
        "An invalid type for `close` was returned from the subscription callback."
      );
    }

    const _close = close;

    // Why use `var`? This avoids issues if `error` or `complete` is called
    // before this variable is initialized. With `let` or `const`, we could run
    // into TDZ issues.
    var subscription = new Subscription(() => {
      closed = true;
      _close();
    });

    if (closed) {
      forceClose(subscription);
    }

    return subscription;
  }

  [Symbol.observable]() {
    return this;
  }
}

let forceClose: (subscription: Subscription | undefined) => void;

export class Subscription {
  #closed = false;
  #close: () => void;

  static {
    forceClose = (subscription) => {
      if (!subscription) return;
      subscription.#closed = true;
    };
  }

  constructor(close: () => void) {
    this.#close = close;
  }

  unsubscribe() {
    this.#closed = true;
    this.#close();
  }

  get closed() {
    return this.#closed;
  }
}

declare global {
  interface SymbolConstructor {
    readonly observable: unique symbol;
  }
}

export function test() {
  runTests(Observable);
}
