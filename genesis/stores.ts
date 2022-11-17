// Genesis stores to track values, objects, and computed properties.

import { effect, event } from "./core";

export type Signal<T> = readonly [get: () => T, set: (newValue: T) => void];

/**
 * Creates a tuple that can get and set a given value. If `get` is called from
 * within an effect, the effect will be re-run when `set` is called.
 */
export function signal<T>(value: T): Signal<T> {
  const [track, trigger] = event();

  return [
    () => (track(), value),
    (newValue) => ((value = newValue), trigger()),
  ];
}

/** Creates a memo that is only updated when its dependencies change. */
export function memo<T>(fn: () => T): () => T {
  const [get, set] = signal<T>(null!);

  effect(() => set(fn()));

  return get;
}

/** Creates a memo that updates asynchronously. */
export function async<T>(initial: T, fn: () => T | PromiseLike<T>): () => T {
  let asyncId = 0;
  const [get, set] = signal<T>(initial);

  effect(async () => {
    const myId = asyncId++;
    const next = await fn();

    if (asyncId == myId) {
      set(next);
    }
  });

  return get;
}

const proxyMap = new WeakMap<object, object>();

const arrayKeys = new Set([
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift",
]);

const setKeys = new Set(["add", "clear", "delete"]);

const mapKeys = new Set(["clear", "delete", "set"]);

/** Creates a proxy that tracks read and write operations. */
export function proxy<T extends object>(value: T): T {
  let proxy = proxyMap.get(value) as T | undefined;

  if (proxy) {
    return proxy;
  }

  const setterKeys: Set<string | symbol> | undefined = Array.isArray(value)
    ? arrayKeys
    : value instanceof Set
    ? setKeys
    : value instanceof Map
    ? mapKeys
    : undefined;

  const [track, trigger] = event();

  proxy = new Proxy<T>(value, {
    get(target, p, receiver) {
      if (setterKeys?.has(p)) {
        const prop = Reflect.get(target, p, receiver);

        if (typeof prop == "function") {
          return function (this: any, ...args: any[]): any {
            Reflect.apply(prop, this, args);
            trigger();
          };
        } else {
          return prop;
        }
      }

      const result = Reflect.get(target, p, receiver);
      track();
      return result;
    },
    set(target, p, newValue, receiver) {
      const result = Reflect.set(target, p, newValue, receiver);
      trigger();
      return result;
    },
  });

  proxyMap.set(value, proxy);
  return proxy;
}
