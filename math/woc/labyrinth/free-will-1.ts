export class NodeN {
    readonly #paths = new Map<string, Set<NodeN>>()
    readonly #pnull = new Set<NodeN>()
    readonly #refs = new Map<string, Set<NodeN>>()
    readonly #roots = new Set<LabyrinthN>()

    readonly paths: ReadonlyMap<string, ReadonlySet<NodeN>> = this.#paths
    readonly pnull: ReadonlySet<NodeN> = this.#pnull

    constructor(readonly rom: boolean) {}

    addTransition(char: string, to: NodeN) {
        let set = this.#paths.get(char)
        if (!set) {
            set = new Set()
            this.#paths.set(char, set)
        }

        set.add(to)
        for (const immediate of to.#pnull) {
            set.add(immediate)
        }

        let set2 = to.#refs.get(char)
        if (!set2) {
            set2 = new Set()
            to.#refs.set(char, set2)
        }
        set2.add(this)
    }

    addVoidTransition(to: NodeN) {
        const added = new Set([to]).union(to.#pnull)
        for (const el of added) {
            this.#pnull.add(el)
        }

        for (const [char, refs] of this.#refs) {
            for (const ref of refs) {
                const paths = ref.#paths.get(char)!
                for (const el of added) {
                    paths.add(el)

                    let set = el.#refs.get(char)
                    if (!set) {
                        set = new Set()
                        el.#refs.set(char, set)
                    }
                    set.add(ref)
                }
            }
        }

        for (const root of this.#roots) {
            for (const el of added) {
                ;(root.roots as Set<NodeN>).add(el)
            }
        }
    }
}

export class LabyrinthN {
    readonly #roots = new Set<NodeN>()

    readonly roots: ReadonlySet<NodeN> = this.#roots

    addRoot(root: NodeN) {
        this.#roots.add(root)
        for (const el of root.pnull) {
            this.#roots.add(el)
        }
    }
}
