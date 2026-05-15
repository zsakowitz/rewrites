import { moduleToString, type AxiomComputationalRule, type Def, type Expr, type Level, type Module } from "./core"

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

export function Pair(fst: Expr, snd: Expr): Expr {
    return { k: "pair", fst, snd }
}

export function Pi(...body: Expr[]): Expr {
    return body.reduceRight((ret, arg) => ({ k: "prod", arg, ret }))
}

export function Func(ret: Expr): Expr {
    return { k: "func", ret }
}

export function Apply(f: Expr, ...x: Expr[]): Expr {
    return x.reduce((f, x) => ({ k: "app", f, x }), f)
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
        ) => {
            (...args: Level[]): Expr
            defId: number
        },
        axiom: (
            name: string,
            levelArgs: number,
            type: Expr,
            rule: AxiomComputationalRule | null,
        ) => {
            (...args: Level[]): Expr
            defId: number
        },
    ) => void,
): Module {
    const mod: Def[] = []

    body(
        (name, levels, type, v) => {
            const defId = mod.length
            mod.push({ name, levels, level: null, type, body: { k: true, v } })

            function body(...levels: Level[]): Expr {
                return { k: "ref", defId, levels }
            }

            body.defId = defId

            return body
        },
        (name, levels, type, v) => {
            const defId = mod.length
            mod.push({ name, levels, level: null, type, body: { k: false, v } })

            function body(...levels: Level[]): Expr {
                return { k: "ref", defId, levels }
            }

            body.defId = defId

            return body
        },
    )

    console.log(moduleToString(mod))

    return mod
}
