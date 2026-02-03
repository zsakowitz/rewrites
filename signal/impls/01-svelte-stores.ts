// An implementation of Svelte stores. #rewrite

export type StopFunction = () => void
export type Subscriber<T> = (value: T) => void
export type UpdateFunction<T> = (value: T) => T
export type Executor<T> = (update: (value: T) => void) => void

export interface Store<T> {
    set?(value: T): void
    subscribe(onUpdate: Subscriber<T>): StopFunction
}

export interface Readable<T> extends Exclude<Store<T>, "set"> {}

export interface Writable<T> extends Store<T> {
    set(value: T): void
}

export interface AsyncWritable<T> extends Store<T> {
    set(value: T | PromiseLike<T>): void
}

export function writable<T>(value: T): Writable<T> {
    const listeners = new Set<Subscriber<T>>()

    return {
        set(v) {
            value = v
            listeners.forEach((fn) => fn(value))
        },
        subscribe(onUpdate) {
            listeners.add(onUpdate)
            onUpdate(value)
            return () => listeners.delete(onUpdate)
        },
    }
}

export function readable<T>(value: T, executor: Executor<T>): Store<T> {
    const { set, subscribe } = writable<T>(value)

    executor(set)

    return { subscribe }
}

export function asyncWritable<T>(value: T): AsyncWritable<T> {
    const { set, subscribe } = writable<T>(value)
    let asyncId = 0

    return {
        subscribe,
        async set(value) {
            const id = ++asyncId
            const result = await value

            if (asyncId === id) set(result)
        },
    }
}

export function asyncReadable<T>(value: T, executor: Executor<Promise<T>>) {
    const { set, subscribe } = asyncWritable<T>(value)

    executor(set)

    return { subscribe }
}
