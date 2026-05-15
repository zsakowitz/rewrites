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

export function Pair(fst: Expr, snd: Expr): Expr {
    return { k: "pair", fst, snd }
}

export function Pi(...body: Expr[]): Expr {
    return body.reduceRight((ret, arg) => ({ k: "prod", arg, ret }))
}

export function Func(ret: Expr): Expr {
    return { k: "func", ret }
}

export function Axiom(type: Expr): Expr {
    return { k: "axiom", type }
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
    const zero = axiom("0", 0, U(Z))

    const zero_ind = axiom("0-rec", 1, Pi(U(Larg(0)), Pi(zero(), Var(1))))

    const not = (x: Expr) => Pi(x, zero())

    const not_not_not_x_implies_x = def(
        "¬¬¬X=>¬X",
        1,
        Pi(U(Larg(0)), Pi(not(not(not(Var(0)))), not(Var(1)))),
        Func(
            // accepts X
            Func(
                // accepts ¬¬¬X
                Func(
                    // accepts X
                    Apply(
                        Var(1), // ¬¬¬X
                        Func(
                            // accepts ¬X
                            Apply(
                                Var(0), // ¬X
                                Var(2), // X
                            ), // 0
                        ), // ¬¬X
                    ), // 0
                ),
            ),
        ),
    )

    const Id = axiom("Id", 1, Pi(U(Larg(0)), Var(0), Var(1), U(Larg(0))))

    const refl = axiom(
        "refl",
        1,
        Pi(U(Larg(0)), Var(0), Apply(Id(Larg(0)), Var(1), Var(0), Var(0))),
    )

    const IdInd = axiom(
        "ind-Id",
        2,
        Pi(
            U(Larg(0)), // T: Uu
            Pi(
                Var(0),
                Var(1),
                Apply(Id(Larg(0)), Var(2), Var(1), Var(0)),
                U(Larg(1)),
            ), // P: (x: T) -> (y: T) -> (p: Id T x y) -> Uv
            Pi(
                Var(0),
                Apply(
                    Var(1),
                    Var(0),
                    Var(0),
                    Apply(refl(Larg(0)), Var(2), Var(0)),
                ),
            ), // D: (x: T) -> P x x (refl x)
            Var(2),
            Var(3),
            Apply(Id(Larg(0)), Var(4), Var(1), Var(0)),
            Apply(Var(4), Var(2), Var(1), Var(0)),
        ),
    )
})
