let currentScope: Scope | undefined
let currentReactor: Reactor | undefined
let isBatching = false
const scheduled = new Set<Reactor>()

interface Scope {
  /** Adds a cleanup function. */
  c(onCleanup: () => void): void

  /** Cleans up this scope. */
  k(): void
}

interface Reactor {
  /** Notifies this reactor it has accessed a signal. */
  n(signal: Signal): void

  /** Triggers this reactor to update. */
  f(): void
}

interface Signal {
  /** Removes references to the given reactor from this signal. */
  r(reactor: Reactor): void
}

export type Setter<T> = {
  (value: Exclude<T, Function>): T
  (update: (value: T) => T): T
}

function schedule(reactor: Reactor) {
  scheduled.add(reactor)
}

function runScheduled() {
  if (isBatching) return
  const s = Array.from(scheduled)
  scheduled.clear()
  s.forEach(safeReact)
}

function safeReact(f: Reactor) {
  try {
    f.f()
  } catch {}
}

function safeCall(f: () => void) {
  try {
    f()
  } catch {}
}

function strictEqual<T>(a: T, b: T) {
  return a === b
}

function createSignal<T>(
  value: T,
  isEqual: (oldValue: T, newValuee: T) => unknown = strictEqual,
) {
  const reactors = new Set<Reactor>()

  const signal: Signal = {
    r(reactor) {
      reactors.delete(reactor)
    },
  }

  return [
    () => {
      if (currentReactor) {
        currentReactor.n(signal)
        reactors.add(currentReactor)
      }
      return value
    },
    (next: T | ((value: T) => T)) => {
      if (typeof next == "function") {
        next = (next as (value: T) => T)(value)
      }

      if (isEqual(value, next)) {
        return
      }

      value = next
      reactors.forEach(schedule)
      runScheduled()
    },
  ]
}

function createEffect(fn: () => void) {
  const signals = new Set<Signal>()
  const cleanups = new Set<() => void>()

  const scope: Scope & Reactor = {
    c(onCleanup) {
      cleanups.add(onCleanup)
    },
    k() {
      const c = Array.from(cleanups)
      cleanups.clear()
      c.forEach(safeCall)
    },
    n(signal) {
      signals.add(signal)
    },
    f() {
      const parentScope = currentScope
      const parentReactor = currentReactor
      try {
        currentReactor = currentScope = scope
        scope.k()
        signals.forEach(removeSelf)
        signals.clear()
        fn()
      } finally {
        currentReactor = parentReactor
        currentScope = parentScope
      }
    },
  }

  if (currentScope) {
    currentScope.c(scope.k)
  }

  scope.f()

  function removeSelf(signal: Signal) {
    signal.r(scope)
  }
}
