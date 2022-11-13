// The core of a fine-grained reactivity library.

let currentEffect: (() => void) | undefined;

/** Runs a function and tracks any dependencies within it. */
export function effect<T>(fn: () => T): T {
  const parentEffect = currentEffect;
  currentEffect = fn;
  const value = fn();
  currentEffect = parentEffect;
  return value;
}

/** Prevents events from being tracked during the function call. */
export function untrack<T>(fn: () => T): T {
  const parentEffect = currentEffect;
  currentEffect = undefined;
  const value = fn();
  currentEffect = parentEffect;
  return value;
}

let currentBatch: Set<Set<() => void>> | undefined;

const queue = (action: Set<() => void>): void =>
  void (currentBatch?.add(action) || action.forEach((fn) => fn()));

/**
 * Creates a tuple of track, trigger, and cleanup functions. When `track` is
 * called, the currently running effect (if any) is added to an internal
 * tracking list. When `trigger` is called, all effects that have been tracked
 * are re-run. When `cleanup` is called, the internal tracking list is cleared.
 */
export function event(): readonly [track: () => void, trigger: () => void] {
  const tracking = new Set<() => void>();

  return [
    () => currentEffect && tracking.add(currentEffect),
    () => queue(tracking),
  ];
}

/** Batches all `trigger` calls within the function and calls them all at once. */
export function batch<T>(fn: () => T): T {
  const parentBatch = currentBatch;
  currentBatch = new Set();
  const value = fn();
  currentBatch.forEach((set) => set.forEach((fn) => fn()));
  currentBatch.clear();
  currentBatch = parentBatch;
  return value;
}

/**
 * Ignores the effect of a containing `batch` block and immediately runs
 * `trigger`s inside the passed function.
 */
export function instant<T>(fn: () => T): T {
  const parentBatch = currentBatch;
  currentBatch = undefined;
  const value = fn();
  currentBatch = parentBatch;
  return value;
}
