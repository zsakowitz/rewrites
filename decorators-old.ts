// A reactive system that uses decorators instead of plain values.

import { createEffect, createMemo, createSignal } from "./solid.js"

export function signal<This, Value>(
  value: ClassAccessorDecoratorTarget<This, Value>,
  _context: ClassAccessorDecoratorContext<This, Value>,
): ClassAccessorDecoratorResult<This, Value> {
  type Signal = [() => Value, (value: Value) => void]

  function getSignalFor(self: This) {
    let signal = value.get.call(self) as unknown as Signal | undefined

    if (signal) {
      return signal
    }

    signal = createSignal(value.get.call(self))
    value.set.call(self, signal as any)
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

const UNSET = Symbol("unset")

export function cached<This, Value>(
  value: (this: This) => Value,
  _context: ClassGetterDecoratorContext<This, () => Value>,
) {
  type Cache = [isOutdated: boolean, value: typeof UNSET | Value]

  const caches = new WeakMap<any, Cache>()

  function getCacheFor(self: This) {
    {
      const cache = caches.get(self)

      if (cache) {
        return cache
      }
    }

    const cache: Cache = [false, UNSET]
    caches.set(self, cache)

    let isFirstTime = true

    createEffect(() => {
      cache[0] = !isFirstTime
      cache[1] = isFirstTime ? value.call(self) : UNSET
      isFirstTime = false
    })

    return cache
  }

  return function (this: This): Value {
    const cache = getCacheFor(this)

    if (cache[0] || cache[1] == UNSET) {
      cache[0] = false
      return (cache[1] = value.call(this))
    }

    return cache[1]
  }
}

export function computed<This, Value>(
  value: (this: This) => Value,
  _context: ClassGetterDecoratorContext<This, Value>,
) {
  const memos = new WeakMap<any, () => Value>()

  function getMemoFor(self: This) {
    {
      const memo = memos.get(self)

      if (memo) {
        return memo
      }
    }

    const memo = createMemo(value.bind(self) as () => Value)
    memos.set(self, memo)
    return memo
  }

  return function (this: This) {
    return getMemoFor(this)()
  }
}

export function effect<Class extends abstract new (...args: any) => any>(
  fn: (this: InstanceType<Class>) => void,
) {
  return (value: Class, _context: ClassDecoratorContext<Class>) => {
    abstract class InnerClass extends value {
      constructor(...args: any[]) {
        super(...args)
        createEffect(fn.bind(this as InstanceType<Class>) as () => void)
      }
    }

    return InnerClass
  }
}

export function untrack<
  This,
  Value extends (this: This, ...args: unknown[]) => unknown,
>(
  value: Value,
  context:
    | ClassGetterDecoratorContext<This, Value>
    | ClassSetterDecoratorContext<This, Value>
    | ClassMethodDecoratorContext<This, Value>,
) {
  return function (this: This) {
    return untrack(() => value.apply(this, arguments as any), context)
  }
}
