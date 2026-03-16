export type Ref<T> = number & { readonly __item: T }

export interface Item<T> {
    visible: boolean
    value: T
    compute: () => T
    stale: boolean
    usedBy: Set<number>
}

export class Scene<I> {
    #items: Item<I>[] = []

    markStale(r: Ref<I>) {
        const todo = new Set<number>([r])
        const done = new Set<number>()

        for (const el of todo) {
            todo.delete(el)
            done.add(el)
            const item = this.#items[el]!
            item.stale = true
            for (const el of item.usedBy) {
                if (!done.has(el)) {
                    todo.add(el)
                }
            }
        }
    }

    fn<T extends I>(deps: Ref<I>[], compute: () => T): Ref<T> {
        const item: Item<T> = {
            visible: true,
            value: null!,
            compute,
            stale: true,
            usedBy: new Set(),
        }

        const ref = this.#items.length as Ref<T>
        for (const el of deps) {
            this.#items[el]!.usedBy.add(ref)
        }

        this.#items.push(item)
        item.value = this.get(ref)

        return ref
    }

    let<T extends I>(initial: T): [Ref<T>, (v: T) => void] {
        const ref = this.fn([], () => initial)

        return [
            ref,
            (v) => {
                initial = v
                this.markStale(ref)
            },
        ]
    }

    get<T extends I>(ref: Ref<T>): T {
        const item = this.#items[ref]!
        if (!item.stale) return item.value as T

        const next = (item.value = item.compute() as T)
        item.stale = false
        console.log("computed", ref)

        return next
    }

    getAll(): I[] {
        const ret = []
        for (let i = 0; i < this.#items.length; i++) {
            ret.push(this.get(i as Ref<I>))
        }

        return ret
    }
}
