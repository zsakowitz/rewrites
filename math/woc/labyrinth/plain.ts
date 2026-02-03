export class NodeD {
    constructor(readonly rom: boolean) {}

    readonly paths = new Map<string, NodeD>()
}

export class LabyrinthD {
    constructor(readonly root: NodeD) {}

    walk(text: string) {
        let on = this.root

        for (const char of text) {
            const next = on.paths.get(char)
            if (!next) return null
            on = next
        }

        return on
    }
}
