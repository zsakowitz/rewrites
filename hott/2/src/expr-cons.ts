import type { Expr, Level } from "./decl"
import { N } from "./level-cons"

export function Uni(level: Level | number): Expr {
    if (typeof level == "number") {
        return { k: "universe", v: { k: "lvar", v: level } }
    }

    return { k: "universe", v: level }
}

export function UniN(level: number): Expr {
    return { k: "universe", v: N(level) }
}

export function Var(idx: number): Expr {
    return { k: "var", v: idx }
}

export function Sum(arg: Expr, body: Expr): Expr {
    return { k: "sum", arg, body }
}

export function Pair(fst: Expr, snd: Expr): Expr {
    return { k: "pair", f: fst, x: snd }
}

export function Prod(arg: Expr, body: Expr): Expr {
    return { k: "prod", arg, body }
}

export function Pi(...exprs: Expr[]): Expr {
    return exprs.reduceRight((body, arg) => ({ k: "prod", arg, body }))
}

export function Func(ret: Expr): Expr {
    return { k: "func", v: ret }
}

export function Fn(args: number, ret: Expr): Expr {
    while (args--) ret = { k: "func", v: ret }
    return ret
}

export function App(f: Expr, x: Expr): Expr {
    return { k: "app", f, x }
}

export function Apply(f: Expr, ...args: Expr[]): Expr {
    for (let i = 0; i < args.length; i++) {
        f = { k: "app", f, x: args[i]! }
    }

    return f
}

export function Ref(defId: number, levels: readonly Level[]): Expr {
    return { k: "ref", defId, levels }
}

export function Cast(type: Expr, value: Expr): Expr {
    return { k: "cast", f: type, x: value }
}
