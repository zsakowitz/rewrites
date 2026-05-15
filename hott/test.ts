import {
    moduleToString,
    type Def,
    type Expr,
    type Level,
    type Module,
} from "./core"

export const Z: Level = { k: "zero", v: null }

export function S(v: Level): Level {
    return { k: "succ", v }
}

export function Max(a: Level, b: Level): Level {
    return { k: "max", v: [a, b] }
}

export function Larg(v: number): Level {
    return { k: "var", v }
}

export function U(level: Level): Expr {
    return { k: "universe", level }
}

export function Sum(fst: Expr, snd: Expr): Expr {
    return { k: "sum", fst, snd }
}

export function Pair(type: Expr, fst: Expr, snd: Expr): Expr {
    return { k: "pair", type, fst, snd }
}

export function Pi(arg: Expr, ret: Expr): Expr {
    return { k: "prod", arg, ret }
}

export function Func(type: Expr, ret: Expr): Expr {
    return { k: "func", type, ret }
}

export function Axiom(type: Expr): Expr {
    return { k: "axiom", type }
}

export function Apply(f: Expr, x: Expr): Expr {
    return { k: "app", f, x }
}

export function Var(idx: number): Expr {
    return { k: "var", var: idx }
}

export function createModule(
    body: (
        def: (
            name: string,
            levelArgs: number,
            type: Expr,
            body: Expr,
        ) => (...args: Level[]) => Expr,
        axiom: (
            name: string,
            levelArgs: number,
            type: Expr,
        ) => (...args: Level[]) => Expr,
    ) => void,
): Module {
    const mod: Def[] = []

    body(
        (name, levels, type, body) => {
            const defId = mod.length
            mod.push({ name, levels, type, body })

            return (...levels) => ({ k: "ref", defId, levels })
        },
        (name, levels, type) => {
            const defId = mod.length
            mod.push({ name, levels, type, body: { k: "axiom", type } })

            return (...levels) => ({ k: "ref", defId, levels })
        },
    )

    console.log(moduleToString(mod))

    return mod
}

createModule((def, axiom) => {
    const dzero = axiom("0", 0, U(Z))
    const dzeroind = axiom("0-rec", 1, Pi(U(Larg(0)), Pi(dzero(), Var(1))))
})
