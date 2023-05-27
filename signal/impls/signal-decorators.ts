// A set of decorators that make working with signals, memos, and effects easier.

import {
  Signal,
  createEffect,
  createMemo,
  createSignal,
  useBatch,
  useUntrack,
} from "./signal"

/** A decorator that turns the given accessor into a reactive signal. */
export function signal<This extends object, Value>(
  value: ClassAccessorDecoratorTarget<This, Value>,
  _context: ClassAccessorDecoratorContext<This, Value>,
): ClassAccessorDecoratorResult<This, Value> {
  const signals = new WeakMap<This, Signal<Value>>()

  function getSignalFor(self: This) {
    let signal = signals.get(self)

    if (signal) {
      return signal
    }

    signal = createSignal(value.get.call(self))
    signals.set(self, signal)
    return signal
  }

  return {
    get() {
      return getSignalFor(this)[0]()
    },
    set(newValue) {
      return getSignalFor(this)[1](newValue)
    },
  }
}

/** A decorator that turns the given getter into a memoized signal. */
export function memo<This extends object, Value>(
  value: (this: This) => Value,
  _context: ClassGetterDecoratorContext<This, Value>,
): (this: This) => Value {
  const memos = new WeakMap<This, () => Value>()

  function getMemoFor(self: This): () => Value {
    {
      const memo = memos.get(self)

      if (memo) {
        return memo
      }
    }

    const memo = createMemo(value.bind<(this: This) => Value>(self))
    memos.set(self, memo)
    return memo
  }

  return function (this: This) {
    return getMemoFor(this)()
  }
}

/** A decorator that runs the given method when any of its dependencies change. */
export function effect<This, Value extends (this: This) => any>(
  value: Value,
  context: ClassMethodDecoratorContext<This, Value>,
): Value {
  context.addInitializer(function (this) {
    createEffect(() => value.call(this))
  })

  return value
}

/**
 * A decorator that prevents signals accessed in the getter, setter, or method
 * from being tracked in nearby effects.
 */
export function untrack<This, Value extends (this: This, ...args: any) => any>(
  value: Value,
  _context:
    | ClassGetterDecoratorContext<This, ReturnType<Value>>
    | ClassMethodDecoratorContext<This, Value>
    | ClassSetterDecoratorContext<This, ReturnType<Value>>,
): Value {
  return function (...args) {
    return useUntrack(() => value.apply(this, args))
  } as Value
}

/**
 * A decorator that batches signal modifications in a getter, setter, or method,
 * and only re-runs dependent effects and memos once.
 */
export function batch<This, Value extends (this: This, ...args: any) => any>(
  value: Value,
  _context:
    | ClassGetterDecoratorContext<This, ReturnType<Value>>
    | ClassMethodDecoratorContext<This, Value>
    | ClassSetterDecoratorContext<This, ReturnType<Value>>,
): Value {
  return function (...args) {
    return useBatch(() => value.apply(this, args))
  } as Value
}
