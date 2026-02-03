function nand(a: boolean, b: boolean) {
    return !(a && b)
}

function go(
    inputs: boolean[],
    brain: [number, number][],
    outputs: number[],
): boolean[] {
    for (const [ai, bi] of brain) {
        inputs.push(nand(inputs[ai]!, inputs[bi]!))
    }
    return outputs.map((i) => inputs[i]!)
}

type Gate = [number, number]
type Brain = Gate[]
type Output = number[]

function genGates(inputs: number): Gate[] {
    const ret: Gate[] = []

    for (let a = 0; a < inputs; a++) {
        for (let b = 0; b <= a; b++) {
            ret.push([a, b])
        }
    }

    return ret
}

function simple(brain: Brain): boolean {
    let seen: number[] = []

    for (const [a, b] of brain) {
        const n = 1e4 * a + b
        if (seen.includes(n)) return false
        seen.push(n)
    }

    return true
}

function genBrains(inputs: number, size: number): Brain[] {
    let ret: Brain[] = [[]]

    while (size) {
        size--
        ret = ret
            .flatMap((brain) => genGates(inputs).map((g) => [...brain, g]))
            .filter(simple)
        inputs++
    }

    return ret
}

function genOutputs(inputs: number, size: number): Output[] {
    let rt: Output[] = [[]]

    while (size) {
        size--
        rt = rt.flatMap((o) =>
            Array.from({ length: inputs }, (_, i) => [...o, i]),
        )
    }

    return rt
}
