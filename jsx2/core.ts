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
  context: Record<symbol, any> | undefined
  readonly cleanups = new Set<() => void>()

  constructor() {
    if (currentScope) {
      currentScope.cleanups.add(this.cleanup.bind(this))
      this.context = currentScope.context
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

  abstract fn(): void

  constructor() {
    super()
  }
}

class Effect<T> extends Reactor {
  constructor(readonly effect: (value: T) => T, public value: T) {
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

  fn(): void {
    for (const s of this.signals) {
      s.reactors.delete(this)
    }
    this.signals.clear()

    let parentScope = currentScope
    let parentReactor = currentReactor
    try {
      currentScope = currentReactor = this
      this.cleanup()
      const next = (0, this.effect)(this.value)
      this.value = next
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
    if ((0, this.equal)(last, next)) {
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

  fn(): void {
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
      const next = (0, this.compute)(old)
      const equal = (0, this.equal)(old, next)
      this.value = next
      this.stale = false
      return equal
    } finally {
      currentScope = parentScope
      currentReactor = parentReactor
    }
  }

  get(): T {
    if (currentReactor) {
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
  (value: Exclude<T, Function>): T
  (fn: () => T): T
}

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

/**
 * This returns a function. That function, when called, calls its argument in
 * the same scope and tracking context as the original call to `preserve`.
 */
export function preserveTracking(): <T>(fn: () => T) => T {
  const scope = currentScope
  const reactor = currentReactor
  return (fn)=>{
    const parentScope = currentScope
    const parentReactor = currentReactor
    try {
      currentScope=scope
      currentReactor=reactor
      return fn()
    } finally {
      currentScope=parentScope
      currentReactor=parentReactor
    }
  }
}

export interface Context<T, Default extends T | undefined> {
  /** Renders an element with a given value for this context provider. */
  <U>(props: { value: T; children: U }): U

  /** Calls a function with a particular value for this context. */
  with<U>(value: () => T, fn: () => U): U

  /** Gets the value of the context, or throws if it does not exist. */
  get(): T

  /**
   * Gets the value of the context, returning the default value if called from
   * outside the context provider.
   */
  getSafe(): T | Default

  /** The unique id representing this context. */
  id: symbol
}

// value is definitely assigned
export function context<T>(defaultValue: T): Context<T, T>

// value might be undefined
export function context<T>(defaultValue?: T | undefined): Context<T, undefined>

// implementation
export function context<T>(
  defaultValue?: T | undefined,
): Context<T, undefined> {
  const id = Symbol()

  function Provider<V>(props: { value: T; children: V }): V {
    return Provider.with(
      () => props.value,
      () => props.children,
    )
  }

  Provider.with = <U>(value: () => T, fn: () => U): U => {
    const scope = new Scope()
    scope.context = {
      ...scope.context,
      get [id]() {
        return value()
      },
    }
    const parentScope = currentScope
    try {
      currentScope = scope
      return untrack(fn)
    } finally {
      currentScope = parentScope
    }
  }

  Provider.get = () => {
    const context = currentScope?.context
    if (context && id in context) {
      return context[id]
    } else {
      throw new Error(
        "Context value was accessed outside of its context provider.",
      )
    }
  }

  Provider.getSafe = () => {
    const context = currentScope?.context
    if (context && id in context) {
      return context[id]
    } else {
      return defaultValue
    }
  }

  Provider.id = id

  return Provider
}
