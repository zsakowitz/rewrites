type Sym = { k: "input"; v: number }

interface Node {
    readonly id: number

    eval(): boolean
    track(set: Set<NodeInput>): void
}

let nextId = 0

class NodeInput implements Node {
    constructor(readonly name: string) {}

    value = false
    readonly id = nextId++

    eval(): boolean {
        return this.value
    }

    track(set: Set<NodeInput>): void {
        set.add(this)
    }
}

class NodeNand implements Node {
    readonly id = nextId++

    constructor(
        readonly a: Node,
        readonly b: Node,
    ) {}

    eval() {
        return !(this.a.eval() && this.b.eval())
    }

    track(set: Set<NodeInput>): void {
        this.a.track(set)
        this.b.track(set)
    }
}

function nand(a: Node, b: Node): Node {
    return new NodeNand(a, b)
}

function not(a: Node): Node {
    return new NodeNand(a, a)
}

function and(a: Node, b: Node): Node {
    return not(nand(a, b))
}

function or(a: Node, b: Node): Node {
    return nand(not(a), not(b))
}

function xor(a: Node, b: Node): Node {
    const J = nand(a, b)
    const A = nand(J, a)
    const B = nand(J, b)
    return nand(A, B)
}

function truthTable(a: Record<string, Node>): string {
    const inputSet = new Set<NodeInput>()
    for (const key in a) a[key]!.track(inputSet)

    const inputs = Array.from(inputSet)
    inputs.sort((a, b) => a.id - b.id)

    let data =
        inputs.map((x) => x.name).join("")
        + " "
        + Object.keys(a)
            .map((x) => x)
            .join("")

    for (let i = 0; i < 2 ** inputs.length; i++) {
        let row = ""
        for (let j = 0; j < inputs.length; j++) {
            const val = !!((2 ** j) & i)
            inputs[j]!.value = val
            row += +val
        }
        row += " "
        for (const key in a) {
            row += +a[key]!.eval()
        }
        data += "\n" + row
    }

    return data
}

const A = new NodeInput("A")
const B = new NodeInput("B")
const C = new NodeInput("C")

const hi = or()

console.log(
    truthTable({
        O: xor(new NodeInput("A"), new NodeInput("B")),
    }),
)
