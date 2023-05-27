// An implementation and comparison of stores from multiple frameworks, each with:
// `derived`, which creates a store whose value is computed based on other stores;
// `effect`, which runs an effect when the values of one or more stores change;
// `get`, which retrieves the value of a store;
// `readable`, which creates a store that is read-only;
// `untrack`, which performs a side effect on multiple stores without subscribing to them; and
// `writable`, which creates a store that is readable and writable.

/**
 * If you look through this repository, it becomes pretty obvious which kind
 * of store I like the most, and it's clearly Solid. Solid stores have very
 * concise syntax, work without any compilation, and are still faster than
 * Svelte stores, despite the fact that Svelte literally uses a compiler and
 * Solid is plain JavaScript.
 *
 * The Solid namespace is missing certain methods, namely:
 * - `get`, as Solid stores already expose a getter function.
 *
 * **Minification results:**
 *  345 characters minified
 * (271 without exports)
 *
 * The good parts:
 * - Solid automatically tracks accessed stores in `derived` and `effect`.
 * - Using arrays instead of objects allows for users of Solid style stores to
 *   choose any names they like, instead of being tied to methods predefined by
 *   their framework, such as Vue's `.value` or Svelte's `.set` and `.subscribe`.
 *
 * The bad parts:
 * - None!
 *
 * **My opinion:**
 *
 * Solid has the best kind of stores. They're framework agnostic and minify
 * really well. They have direct getter functions, automatically recognize
 * called getters in `derived` and `effect`, and work with fine-grained
 * reactivity.
 */
export namespace Solid {
  let currentEffect: (() => void) | undefined

  export function writable<T>(
    value: T,
  ): [get: () => T, set: (value: T) => void] {
    const tracking = new Set<() => void>()

    return [
      () => {
        if (currentEffect) {
          tracking.add(currentEffect)
        }

        return value
      },
      (newValue) => {
        value = newValue

        tracking.forEach((fn) => fn())
      },
    ]
  }

  export function readable<T>(
    value: T,
    updater: (set: (value: T) => void) => void,
  ): () => T {
    const [get, set] = writable(value)
    updater(set)
    return get
  }

  export function derived<T>(get: () => T): () => T {
    const [_get, set] = writable<T>(null!)
    effect(() => set(get()))
    return _get
  }

  export function effect(effect: () => void) {
    const parentEffect = currentEffect
    currentEffect = effect
    effect()
    currentEffect = parentEffect
  }

  export function untrack<T>(get: () => T): T {
    const parentEffect = currentEffect
    currentEffect = undefined
    const value = get()
    currentEffect = parentEffect
    return value
  }
}

/**
 * Svelte stores are OK, but they don't have a direct getter function, which I
 * really dislike. Instead, one has to resort to a slightly hacky approach that
 * might not even work with custom stores that call `onUpdate` asynchronously.
 *
 * The Svelte namespace is missing certain methods, namely:
 * - `untrack`, as you can just call the return value of `.subscribe`
 *
 * **Minification results:**
 *  570 characters minified
 * (500 without exports)
 *
 * The good parts:
 * - None!
 *
 * The bad parts:
 * - Using object methods instead of arrays ties users to specific names. Not
 *   only does this reduce choice, but it prevents minification unless you're
 *   working with an entire codebase at once.
 * - Svelte stores don't have a built in `get` function. Instead, `get` relies
 *   on weird semantics that most stores seem to have. However, it could fail
 *   for stores defined in user land; specifically, ones that call `onUpdate`
 *   asynchronously.
 *
 * **My opinion:**
 *
 * Svelte stores are bad. There's no reason to use objects over tuples, and a
 * performance focused framework such as Svelte should know that. Honestly, this
 * in unacceptable.
 */
export namespace Svelte {
  export type Readable<T> = {
    subscribe(onUpdate: (value: T) => void): () => void
  }

  export type Writable<T> = {
    set(value: T): void
  } & Readable<T>

  export type Infer<T extends Readable<any>> = T extends Readable<infer U>
    ? U
    : never

  export function writable<T>(value: T): Writable<T> {
    const subscribers = new Set<(value: T) => void>()

    const set = (newValue: T) => {
      value = newValue
      subscribers.forEach((fn) => fn(value))
    }

    return {
      set,
      subscribe(onUpdate) {
        subscribers.add(onUpdate)
        onUpdate(value)
        return () => subscribers.delete(onUpdate)
      },
    }
  }

  export function readable<T>(
    value: T,
    updater: (set: (value: T) => void) => void,
  ): Readable<T> {
    const { set, subscribe } = writable(value)
    updater(set)
    return { subscribe }
  }

  export function get<T>(store: Readable<T>): T {
    let value!: T
    let didNotGetValue = true
    store.subscribe((storeValue: T) => {
      value = storeValue
      didNotGetValue = false
    })()

    if (didNotGetValue) {
      throw new Error("The passed store did not call 'onUpdate' synchronously.")
    }

    return value
  }

  export function effect<T extends readonly Readable<any>[]>(
    stores: T,
    effect: (...values: { [K in keyof T]: Infer<T[K]> }) => void,
  ) {
    const values: { -readonly [K in keyof T]: Infer<T[K]> } = [] as any

    let isInitialPass = true
    stores.forEach((store, index) => {
      let wasUpdated = false

      store.subscribe((value) => {
        wasUpdated = true
        values[index] = value

        if (!isInitialPass) {
          effect(...values)
        }
      })

      if (!wasUpdated) {
        throw new Error(
          "The passed store did not call 'onUpdate' synchronously.",
        )
      }
    })
    isInitialPass = false

    effect(...values)
  }

  export function derived<T extends readonly Readable<any>[], U>(
    stores: T,
    getValue: (...values: { [K in keyof T]: Infer<T[K]> }) => U,
  ): Readable<U> {
    const { set, subscribe } = writable<U>(null!)
    effect(stores, (...values) => set(getValue(...values)))
    return { subscribe }
  }
}

/**
 * I don't know how Vue ~~stores~~ refs work; I only know that they use getters
 * and setters on the `.value` property. For Vue, I copied the Solid code and
 * changed it to use `.value` instead of an accessor/updater pair.
 *
 * **Minification results:**
 *  487 characters minified
 * (404 without exports)
 *
 * The good parts:
 * - Vue automatically tracks accessed stores in `derived` and `effect`.
 *
 * The bad parts:
 * - It's like Solid, but it uses `.value`. This means that you need to create
 *   additional getters and setters to make a readonly store rather than just
 *   returning the getter function. Using a property also breaks minification.
 *
 * **My opinion:**
 *
 * Vue stores are mid. I don't understand why Vue chose a property over Solid's
 * tuple syntax (which I absolutely love), as it causes a lot of problems with
 * minification. But at least it's 100 characters smaller than Svelte.
 */
export namespace Vue {
  export type Writable<T> = { value: T }
  export type Readable<T> = { readonly value: T }

  let currentEffect: (() => void) | undefined

  export function writable<T>(value: T): Writable<T> {
    const tracking = new Set<() => void>()

    return {
      get value() {
        if (currentEffect) {
          tracking.add(currentEffect)
        }

        return value
      },
      set value(newValue) {
        value = newValue

        tracking.forEach((fn) => fn())
      },
    }
  }

  export function readable<T>(
    value: T,
    updater: (set: (value: T) => void) => void,
  ): Readable<T> {
    const store = writable(value)

    updater((newValue) => {
      store.value = newValue
    })

    return {
      get value() {
        return store.value
      },
    }
  }

  export function derived<T>(get: () => T): Readable<T> {
    const store = writable<T>(null!)

    effect(() => {
      store.value = get()
    })

    return {
      get value() {
        return store.value
      },
    }
  }

  export function effect(effect: () => void) {
    const parentEffect = currentEffect
    currentEffect = effect
    effect()
    currentEffect = parentEffect
  }

  export function untrack<T>(get: () => T): T {
    const parentEffect = currentEffect
    currentEffect = undefined
    const value = get()
    currentEffect = parentEffect
    return value
  }

  export function get<T>(store: Readable<T>): T {
    return untrack(() => store.value)
  }
}
