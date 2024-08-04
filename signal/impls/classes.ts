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
  readonly signals = new Set<Signal<any>>()

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

class Signal<in out T> {
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

export function createImmediateEffect<T>(fn: (value: T) => T, initial: T): void
export function createImmediateEffect<T>(
  fn: (value: T | undefined) => T | undefined,
  initial?: T,
): void
export function createImmediateEffect<T>(
  fn: (value: T | undefined) => T,
  initial?: T,
) {
  new ImmediateEffect(fn, initial)
}

export type SignalArray<T> = [Signal<T>["get"], Signal<T>["set"]]

export function createSignal<T>(
  value: T,
  equal?: (a: T, b: T) => boolean,
): SignalArray<T>
export function createSignal<T>(
  value?: T,
  equal?: (a: T | undefined, b: T | undefined) => boolean,
): SignalArray<T | undefined>
export function createSignal<T>(
  value?: T,
  equal?: (a: T | undefined, b: T | undefined) => boolean,
) {
  const signal = new Signal(value, equal)
  return [signal.get.bind(signal), signal.set.bind(signal)]
}

// needed: root, memo, cleanup, untrack, batch
