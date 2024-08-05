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

export type Name = string | undefined

class Named {
  readonly name: Name

  constructor(options: BaseOptions | undefined) {
    if (options?.name) {
      this.name = options.name
    }
  }
}

class Scope extends Named {
  context: Record<symbol, any> | undefined
  readonly cleanups = new Set<() => void>()

  constructor(options: BaseOptions | undefined) {
    super(options)

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

  constructor(options: BaseOptions | undefined) {
    super(options)

    onCleanup(() => {
      console.log("effect was cleaned up")
      for (const s of this.signals) {
        s.reactors.delete(this)
      }
      this.signals.clear()
    })
  }
}

class Effect<T> extends Reactor {
  public value: T

  constructor(
    readonly effect: (value: T) => T,
    options: EffectOptions<T> | undefined,
  ) {
    super(options)

    // this is okay since we have total control over possible code paths
    this.value = options?.initial!

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

export interface SignalOptions<T> extends BaseOptions {
  equal?(a: T, b: T): boolean
}

const IDENTITY_EQUALITY = (a: unknown, b: unknown) => a === b

class Signal<in out T> extends Named implements SignalLike {
  equal: (a: T, b: T) => boolean

  constructor(private value: T, options: SignalOptions<T> | undefined) {
    super(options)
    this.equal = options?.equal ?? IDENTITY_EQUALITY
  }

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

export interface MemoOptions<T> extends SignalOptions<T> {
  initial?: T
}

class Memo<in out T> extends Reactor implements SignalLike {
  public stale = true
  private value: T
  readonly equal: (a: T, b: T) => boolean

  constructor(
    readonly compute: (last: T | undefined) => T,
    options: MemoOptions<T> | undefined,
  ) {
    super(options)
    this.value = options?.initial! // okay since we control it
    this.equal = options?.equal ?? IDENTITY_EQUALITY
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
  (fn: (value: T) => T): T
}

export interface Root<T> {
  value: T
  dispose(): void
}

export interface BaseOptions {
  name?: Name
}

export interface EffectOptions<T> extends BaseOptions {
  initial?: T
}

export function effect<T>(
  fn: (value: T) => T,
  options: EffectOptions<T> & { initial: T },
): void
export function effect<T>(
  fn: (value: T | undefined) => T | undefined,
  options?: EffectOptions<T>,
): void
export function effect<T>(
  fn: (value: T | undefined) => T,
  options?: EffectOptions<T>,
) {
  new Effect(fn, options)
}

export type SignalArray<T> = [() => T, Setter<T>]

// value is definitely assigned
export function signal<T>(value: T, options?: SignalOptions<T>): SignalArray<T>

// value might be undefined
export function signal<T>(
  value?: T,
  options?: SignalOptions<T>,
): SignalArray<T | undefined>

// implementation
export function signal<T>(value?: T, options?: SignalOptions<T>) {
  const signal = new Signal(value, options)
  return [signal.get.bind(signal), signal.set.bind(signal)]
}

// value is definitely assigned
export function memo<T>(
  compute: (last: T) => T,
  options: MemoOptions<T> & { initial: T },
): () => T

// value might be undefined
export function memo<T>(
  compute: (last: T | undefined) => T,
  options?: MemoOptions<T>,
): () => T

// implementation
export function memo<T>(compute: (last?: T) => T, options?: MemoOptions<T>) {
  const memo = new Memo(compute, options)
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

export function root<T>(fn: () => T, options?: BaseOptions): Root<T> {
  const scope = new Scope(options)
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
  return (fn) => {
    const parentScope = currentScope
    const parentReactor = currentReactor
    try {
      currentScope = scope
      currentReactor = reactor
      return fn()
    } finally {
      currentScope = parentScope
      currentReactor = parentReactor
    }
  }
}

export interface Context<T, Default extends T | undefined> {
  /** Renders an element with a given value for this context provider. */
  <U>(props: { value: T; children: U; name?: Name }): U

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
export function context<T>(
  defaultValue: T,
  options?: BaseOptions,
): Context<T, T>

// value might be undefined
export function context<T>(
  defaultValue?: T | undefined,
  options?: BaseOptions,
): Context<T, undefined>

// implementation
export function context<T>(
  defaultValue?: T | undefined,
  options?: BaseOptions,
): Context<T, undefined> {
  const id = Symbol()

  function Provider<V>(props: { value: T; children: V; name?: Name }): V {
    const scope = new Scope(props)
    scope.context = {
      ...scope.context,
      [id]: props.value,
    }
    const parentScope = currentScope
    try {
      currentScope = scope
      return untrack(() => props.children)
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
