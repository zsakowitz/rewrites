// Creates a Proxy around an object that logs any time an action involving it
// happens. This can be useful for testing ECMAScript internal methods and other
// making sure polyfills emulate the exact behavior of their standardized
// counterparts.

function toString(object: unknown) {
  return String(object).slice(0, 15)
}

function createTrap<A extends [any, ...any[]], R>(
  name: string,
  fn: (...args: A) => R
): (...args: A) => R {
  return (...args: A): R => {
    console.group(`Reflect.${name}()`)

    const value = fn(...args)

    console.log(args)

    console.log(value)

    console.groupEnd()

    return createProxy(value)
  }
}

const handler: Required<ProxyHandler<any>> = Object.create(null)

for (const key of Object.getOwnPropertyNames(Reflect)) {
  ;(handler as any)[key] = createTrap(key, (Reflect as any)[key])
}

export function createProxy<T>(value: T, hint = "value"): T {
  if (typeof value == "object" || typeof value == "function") {
    return new Proxy(value, handler)
  }

  return value
}
