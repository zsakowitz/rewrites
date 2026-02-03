import * as Z from "../../jsx/lib/core"

const SIGNALS = new WeakMap<object, [get: () => any, set: (x: any) => any]>()

export function signal<This extends object, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
): ClassAccessorDecoratorResult<This, Value> {
    return {}
    // return {
    //   get() {},
    //   set(value) {
    //     SIGNALS.get(this)!
    //   },
    //   init(value) {
    //     {
    //       const signal = SIGNALS.get(this)
    //       if (!signal) {
    //       }
    //     }
    //     if (!SIGNALS.get(this)) {
    //       SIGNALS.set(this, Z.signal(value))
    //     } else {
    //     }
    //     return value
    //   },
    // }
}

class Hi {
    @signal
    accessor hi = 2
}
