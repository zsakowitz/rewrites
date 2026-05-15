import { blue, red, reset, yellow } from "./nyalang2/ansi"

export type Level = Readonly<
    | { k: "var"; v: number }
    | { k: "succ"; v: Level }
    | { k: "zero"; v: null }
    | { k: "max"; v: readonly [Level, Level] }
>

/** `$` */
function varName(n: number) {
    return red + ("xyzabcdefghijklmnopqrst"[n] ?? `$` + n) + reset
}

/** `#` */
function lvlName(n: number) {
    return yellow + ("uvw"[n] ?? `#` + n) + reset
}

/** `@` */
function defName(mod: Module, n: number) {
    return blue + (n < mod.length ? `@${mod[n]?.name}` : `def@${n}`) + reset
}

export function levelToString(level: Level): string {
    let n = 0
    while (level.k == "succ") {
        n++
        level = level.v
    }

    return (
        level.k == "var" ? lvlName(level.v) + (n ? "+" + n : "")
        : level.k == "max" ?
            `max(${level.v[0]},${level.v[1]})` + (n ? "+" + n : "")
        : level.k == "zero" ? "" + n
        : "__NEVER__"
    )
}

export function levelArgsToString(level: readonly Level[]): string {
    if (level.length == 0) return ""
    return `.{` + level.map(levelToString).join(",") + `}`
}

export type Expr = Readonly<
    | { k: "universe"; level: Level }
    | { k: "ref"; defId: number; levels: readonly Level[] }
    | { k: "sum"; var: number; fst: Expr; snd: Expr }
    | { k: "pair"; fst: Expr; snd: Expr; type: Expr }
    | { k: "prod"; var: number; arg: Expr; ret: Expr }
    | { k: "func"; var: number; ret: Expr; type: Expr }
    | { k: "app"; f: Expr; x: Expr }
    | { k: "var"; var: number }
    | { k: "axiom"; type: Expr }
>

export function exprToString(mod: Module, expr: Expr): string {
    return (
        expr.k == "universe" ? yellow + "U" + levelToString(expr.level) + reset
        : expr.k == "sum" ?
            `∑(${varName(expr.var)}: ${exprToString(mod, expr.fst)}). ${exprToString(mod, expr.snd)}`
        : expr.k == "pair" ?
            `(${exprToString(mod, expr.fst)}, ${exprToString(mod, expr.snd)})`
        : expr.k == "prod" ?
            `∏(${varName(expr.var)}: ${exprToString(mod, expr.arg)}). ${exprToString(mod, expr.ret)}`
        : expr.k == "func" ?
            `λ${varName(expr.var)}. ${exprToString(mod, expr.ret)}`
        : expr.k == "ref" ?
            defName(mod, expr.defId) + levelArgsToString(expr.levels)
        : expr.k == "app" ?
            `(${exprToString(mod, expr.f)}) (${exprToString(mod, expr.x)})`
        : expr.k == "var" ? varName(expr.var)
        : "__NEVER__"
    )
}

export type Def = Readonly<{
    name: string
    levels: number
    body: Expr
    type: Expr
}>

export function defToString(mod: Module, def: Def): string {
    return `@${def.name}${levelArgsToString(
        Array.from({ length: def.levels }, (_, i) => ({ k: "var", v: i })),
    )} : ${exprToString(mod, def.type)} := ${exprToString(mod, def.body)}`
}

export type Module = readonly Def[]

export function moduleToString(mod: Module): string {
    return mod.map((x) => defToString(mod, x)).join("\n\n")
}

export class Context {
    readonly vars: Record<number, Expr> = Object.create(null)

    constructor(
        readonly mod: Module,
        readonly def: number,
        readonly levels: number,
    ) {}

    e(reason: TemplateStringsArray, ...args: (number | string)[]): never {
        let ret = ""

        for (let i = 0; i < args.length; i++) {
            const reasonText = reason[i]!
            const arg = args[i]!

            if (typeof arg == "string") {
                ret += reasonText + arg
                continue
            }

            if (reasonText.endsWith("$")) {
                ret += reasonText.slice(0, -1) + varName(arg)
                continue
            }

            if (reasonText.endsWith("#")) {
                ret += reasonText.slice(0, -1) + lvlName(arg)
                continue
            }

            if (reasonText.endsWith("@")) {
                ret += reasonText.slice(0, -1) + defName(this.mod, arg)
                continue
            }

            throw new Error(
                `untagged number encountered in error message \`${reason.join("${...}")}\``,
            )
        }

        throw new Error(ret + reason[reason.length - 1]!)
    }

    todo(): never {
        return this.e`this branch is not done yet`
    }
}

/** Assumes all level variables in `base` are present in `args`. */
export function subLevelIntoLevel(base: Level, args: Level[]): Level {
    return (
        base.k == "succ" ? { k: "succ", v: subLevelIntoLevel(base.v, args) }
        : base.k == "max" ?
            {
                k: "max",
                v: [
                    subLevelIntoLevel(base.v[0], args),
                    subLevelIntoLevel(base.v[1], args),
                ],
            }
        : base.k == "var" ? args[base.v]!
        : (base.k satisfies "zero", { k: "zero", v: null })
    )
}

/** Assumes all level variables in `base` are present in `args`. */
export function subLevel(base: Expr, args: Level[]): Expr {
    return (
        base.k == "universe" ?
            { k: "universe", level: subLevelIntoLevel(base.level, args) }
        : base.k == "ref" ?
            {
                k: "ref",
                defId: base.defId,
                levels: base.levels.map((x) => subLevelIntoLevel(x, args)),
            }
        : base.k == "sum" ?
            {
                k: "sum",
                var: base.var,
                fst: subLevel(base.fst, args),
                snd: subLevel(base.snd, args),
            }
        : base.k == "pair" ?
            {
                k: "pair",
                fst: subLevel(base.fst, args),
                snd: subLevel(base.snd, args),
                type: subLevel(base.type, args),
            }
        : base.k == "prod" ?
            {
                k: "prod",
                var: base.var,
                arg: subLevel(base.arg, args),
                ret: subLevel(base.ret, args),
            }
        : base.k == "func" ?
            {
                k: "func",
                var: base.var,
                ret: subLevel(base.ret, args),
                type: subLevel(base.type, args),
            }
        : base.k == "app" ?
            { k: "app", f: subLevel(base.f, args), x: subLevel(base.x, args) }
        : base.k == "var" ? base
        : (base.k satisfies "axiom",
            { k: "axiom", type: subLevel(base.type, args) })
    )
}
