import type { Level } from "./decl"

const enum Prec {
    Atom,
    Application,
    LevelSum,
}

// #
function levelVar(x: number): string {
    return "uvwxyz"[x] ?? "#" + x
}

function printLevelInner(x: Level): [string, Prec] {
    let n = 0
    while (x.k == "succ") (n++, (x = x.v))

    if (x.k == "zero") return ["" + n, Prec.Atom]

    const N = n ? " + " + n : ""

    if (x.k == "var") return [levelVar(x.v) + N, n ? Prec.LevelSum : Prec.Atom]

    let [a, pa] = printLevelInner(x.v[0])
    if (pa >= Prec.Application) a = `(${a})`

    let [b, pb] = printLevelInner(x.v[1])
    if (pb >= Prec.Application) b = `(${b})`

    return [`max ${a} ${b}${N}`, n ? Prec.LevelSum : Prec.Application]
}

export function printLevel(x: Level): string {
    return printLevelInner(x)[0]
}
