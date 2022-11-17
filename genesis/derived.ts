// Derived Genesis stores.

import { Signal } from "./stores";

/** Creates a derived Genesis store with two-way control. */
export function derived<T, U>(
  [get, set]: Signal<T>,
  toTarget: (input: T) => U,
  toSource: (input: U) => T
): Signal<U> {
  return [() => toTarget(get()), (input) => set(toSource(input))];
}

/** Allows a store to be passed JSON values. */
export function asJSON<T>(store: Signal<T>): Signal<string> {
  return derived(store, JSON.stringify, JSON.parse);
}
