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
  for (const item of scheduled) {
    scheduled.delete(item)
    item.fn()
  }
}

let currentScope: Scope | null = null
let currentReactor: Reactor | null = null

class Scope {
  readonly cleanups = new Set<() => void>()
  readonly parent: Scope | undefined
}

abstract class Reactor extends Scope {
  readonly signals = new Set<SignalLike>()

  abstract fn(this: this): void

  constructor() {
    super()
  }
}

class ImmediateEffect<T> extends Reactor {
  constructor(readonly effect: (this: void, value: T) => T, public value: T) {
    super()
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
      this.value = (currentScope = currentReactor = this).effect(this.value)
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

  set(v: T): T {
    if (this.equal(this.value, v)) {
      return v
    }
    this.value = v
    this.reactors.forEach(schedule)
    runAll()
    return v
  }
}

class Memo<in out T> extends Reactor implements SignalLike {
  public stale = false

  constructor(
    readonly compute: (last: T | undefined) => T,
    private value: T,
    readonly equal: (a: T, b: T) => boolean = (a, b) => a === b,
  ) {
    super()
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
      const next = (currentScope = currentReactor = this).compute(this.value)
      const equal = this.equal(this.value, next)
      if (!equal) {
        this.value = next
      }
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

export function immediateEffect<T>(fn: (value: T) => T, initial: T): void
export function immediateEffect<T>(
  fn: (value: T | undefined) => T | undefined,
  initial?: T,
): void
export function immediateEffect<T>(
  fn: (value: T | undefined) => T,
  initial?: T,
) {
  new ImmediateEffect(fn, initial)
}

export type SignalArray<T> = [Signal<T>["get"], Signal<T>["set"]]

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

/**
 * Things to add
 *
 * ## Functionality
 *
 * Memos and signals dispose their old values
 *
 * ## Functions
 *
 * - root
 * - cleanup
 * - untrack
 * - batch
 */
