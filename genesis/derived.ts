// Derived Genesis stores.

import { Store } from "./stores";

/** Creates a derived Genesis store with two-way control. */
export function derived<T, U>(
  [get, set]: Store<T>,
  toTarget: (input: T) => U,
  toSource: (input: U) => T
): Store<U> {
  return [() => toTarget(get()), (input) => set(toSource(input))];
}

/** Allows a store to be passed JSON values. */
export function asJSON<T>(store: Store<T>): Store<string> {
  return derived(store, JSON.stringify, JSON.parse);
}
