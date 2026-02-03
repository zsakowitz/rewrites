// Wraps a function and only allows it to be called once.

export function once<F extends (this: any, ...args: any) => any>(cb: F): F {
    let called = false

    function wrapper(this: any, ...args: any) {
        if (called) return
        called = true

        return cb.call(this, ...args)
    }

    return wrapper as F
}
