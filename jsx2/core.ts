function safeCall(effect: Reactor) {
  try {
    effect.fn()
  } catch {}
}

const scheduled = new Set<Reactor>()

function schedule(item: Reactor) {
  scheduled.add(item)
}

function runAll() {
  if (isBatched) {
    return
  }
  for (const item of scheduled) {
    scheduled.delete(item)
    item.fn()
  }
}

let currentScope: Scope | null = null
let currentReactor: Reactor | null = null
let isBatched = false

class Scope {
  readonly cleanups = new Set<() => void>()

  constructor() {
    if (currentScope) {
      currentScope.cleanups.add(this.cleanup.bind(this))
    }
  }

  cleanup() {
    const all = [...this.cleanups].reverse()
    this.cleanups.clear()
    for (const c of all) {
      try {
        c()
      } catch {}
    }
  }

  run<T>(fn: () => T): T {
    const parentScope = currentScope
    try {
      currentScope = this
      return fn()
    } finally {
      currentScope = parentScope
    }
  }
}

abstract class Reactor extends Scope {
  readonly signals = new Set<SignalLike>()

  abstract fn(this: this): void

  constructor() {
    super()
  }
}

class Effect<T> extends Reactor {
  constructor(readonly effect: (this: void, value: T) => T, public value: T) {
    super()
    onCleanup(() => {
      console.log("effect was cleaned up")
      for (const s of this.signals) {
        s.reactors.delete(this)
      }
      this.signals.clear()
    })
    this.fn()
  }

  fn(this: this): void {
    for (const s of this.signals) {
      s.reactors.delete(this)
    }
    this.signals.clear()

    let parentScope = currentScope
    let parentReactor = currentReactor
    try {
      currentScope = currentReactor = this
      this.value = (0, this.effect)(this.value)
    } finally {
      currentScope = parentScope
      currentReactor = parentReactor
    }
  }
}

interface SignalLike {
  readonly reactors: Set<Reactor>
}

class Signal<in out T> implements SignalLike {
  constructor(
    private value: T,
    private readonly equal: (a: T, b: T) => boolean = (a, b) => a === b,
  ) {}

  readonly reactors = new Set<Reactor>()

  get() {
    if (currentReactor) {
      this.reactors.add(currentReactor)
      currentReactor.signals.add(this)
    }
    return this.value
  }

  set(v: Exclude<T, Function> | ((prev: T) => T)): T {
    const last = this.value
    const next = typeof v == "function" ? (v as (prev: T) => T)(last) : v
    this.value = next
    if (this.equal(last, next)) {
      return next
    }
    this.reactors.forEach(schedule)
    runAll()
    return next
  }
}

class Memo<in out T> extends Reactor implements SignalLike {
  public stale = true

  constructor(
    readonly compute: (last: T | undefined) => T,
    private value: T,
    readonly equal: (a: T, b: T) => boolean = (a, b) => a === b,
  ) {
    super()
    this.update()
  }

  readonly reactors = new Set<Reactor>()

  fn(this: this): void {
    this.stale = true
    if (this.reactors.size) {
      const equal = this.update()
      if (!equal) {
        this.reactors.forEach(schedule)
        runAll()
      }
    }
  }

  /** Returns `true` if the memo's value stayed the same. */
  update() {
    if (!this.stale) {
      return true
    }

    for (const s of this.signals) {
      s.reactors.delete(this)
    }
    this.signals.clear()
    let parentScope = currentScope
    let parentReactor = currentReactor
    try {
      currentScope = currentReactor = this
      this.cleanup()
      const old = this.value
      const next = this.compute(this.value)
      const equal = this.equal(old, next)
      this.value = next
      this.stale = false
      return equal
    } finally {
      currentScope = parentScope
      currentReactor = parentReactor
    }
  }

  get(): T {
    console.log("memo running")
    if (currentReactor) {
      console.log("inside reactor", currentReactor)
      this.reactors.add(currentReactor)
      currentReactor.signals.add(this)
    }
    this.update()
    return this.value
  }
}

export type Setter<T> = {
  <U extends Exclude<T, Function>>(value: U): U
  <U extends Exclude<T, Function>>(fn: (value: T) => U): U
} & (undefined extends T ? (value?: undefined) => undefined : unknown)

export interface Root<T> {
  value: T
  dispose(): void
}

export function effect<T>(fn: (value: T) => T, initial: T): void
export function effect<T>(
  fn: (value: T | undefined) => T | undefined,
  initial?: T,
): void
export function effect<T>(fn: (value: T | undefined) => T, initial?: T) {
  new Effect(fn, initial)
}

export type SignalArray<T> = [() => T, Setter<T>]

// value is definitely assigned
export function signal<T>(
  value: T,
  equal?: (a: T, b: T) => boolean,
): SignalArray<T>

// value might be undefined
export function signal<T>(
  value?: T,
  equal?: (a: T | undefined, b: T | undefined) => boolean,
): SignalArray<T | undefined>

// implementation
export function signal<T>(
  value?: T,
  equal?: (a: T | undefined, b: T | undefined) => boolean,
) {
  const signal = new Signal(value, equal)
  return [signal.get.bind(signal), signal.set.bind(signal)]
}

// value is definitely assigned
export function memo<T>(
  compute: (last: T) => T,
  initial: T,
  equal?: (a: T, b: T) => boolean,
): () => T

// value might be undefined
export function memo<T>(
  compute: (last: T | undefined) => T,
  initial?: T,
  equal?: (a: T | undefined, b: T | undefined) => boolean,
): () => T

// implementation
export function memo<T>(
  compute: (last?: T) => T,
  initial?: T,
  equal?: (a: T | undefined, b: T | undefined) => boolean,
) {
  const memo = new Memo(compute, initial, equal)
  return memo.get.bind(memo)
}

export function onCleanup(fn: () => void) {
  if (currentScope) {
    currentScope.cleanups.add(fn)
  }
}

export function untrack<T>(fn: () => T): T {
  let parentReactor = currentReactor
  try {
    currentReactor = null
    return fn()
  } finally {
    currentReactor = parentReactor
  }
}

export function batch<T>(fn: () => T): T {
  if (isBatched) {
    return fn()
  }
  isBatched = true
  try {
    return fn()
  } finally {
    isBatched = false
    runAll()
  }
}

export function root<T>(fn: () => T): Root<T> {
  const scope = new Scope()
  const value = scope.run(fn)
  return {
    value,
    dispose: scope.cleanup.bind(scope),
  }
}
