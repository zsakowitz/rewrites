// Decorators that make working with signals in classes easy.

import { Signal, createMemo, createSignal, useBatch, useUntrack } from "."

export function untrack<This, Value extends (this: This, ...args: any) => any>(
  value: Value,
  context:
    | ClassGetterDecoratorContext<This, ReturnType<Value>>
    | ClassMethodDecoratorContext<This, Value>
    | ClassSetterDecoratorContext<This, ReturnType<Value>>
) {
  return function (this, ...args) {
    return useUntrack(() => value.apply(this, args))
  } as Value
}

export function batch<This, Value extends (this: This, ...args: any) => any>(
  value: Value,
  context:
    | ClassGetterDecoratorContext<This, ReturnType<Value>>
    | ClassMethodDecoratorContext<This, Value>
    | ClassSetterDecoratorContext<This, ReturnType<Value>>
) {
  return function (this, ...args) {
    return useBatch(() => value.apply(this, args))
  } as Value
}

export function signal<This extends object, Value>(
  value: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  const map = new WeakMap<This, Signal<Value>>()

  function get(self: This) {
    const signal = map.get(self)

    if (!signal) {
      throw new TypeError(
        "Cannot access signal value on an uninitialized object."
      )
    }

    return signal
  }

  return {
    get() {
      return get(this)[0]()
    },
    set(value) {
      get(this)[1](value)
    },
    init(value) {
      map.set(this, createSignal(value))
      return value
    },
  }
}

export function memo<This extends object, Value>(
  value: (this: This) => Value,
  context: ClassGetterDecoratorContext<This, Value>
) {
  const map = new WeakMap<This, () => Value>()

  return function (this: This): Value {
    let memoed = map.get(this)

    if (memoed) {
      return memoed()
    }

    memoed = createMemo(() => value.call(this))

    map.set(this, memoed)

    return memoed()
  }
}

export function effect<Class extends abstract new (...args: any) => any>(
  effect: (this: InstanceType<Class>) => void
) {
  return (value: Class, context: ClassDecoratorContext<Class>) => {
    abstract class ClassWithEffect extends value {
      constructor(...args: any[]) {
        super(...args)
        effect.call(this as InstanceType<Class>)
      }
    }

    return ClassWithEffect
  }
}

@effect(function () {
  console.log(this.a + this.b)
})
class Adder {
  @signal
  accessor a = 0

  @signal
  accessor b = 0
}
