import { blue, dim, red, reset, yellow } from "../nyalang2/ansi"

export type Level = Readonly<
    | { k: "var"; v: number }
    | { k: "succ"; v: Level }
    | { k: "zero"; v: null }
    | { k: "max"; v: readonly [Level, Level] }
>

/** `$` */
function varName(n: number) {
    return red + ("xyzabcdefghijklmnopqrst"[n] ?? "$" + n) + reset
}

/** `#` */
function lvlName(n: number) {
    return yellow + ("uvw"[n] ?? `#` + n) + reset
}

/** `@` */
function defName(mod: Module, n: number) {
    return blue + (n < mod.length ? `${mod[n]?.name}` : `def@${n}`) + reset
}

function levelToStringInner(level: Level): string {
    let n = 0
    while (level.k == "succ") {
        n++
        level = level.v
    }

    return (
        level.k == "var" ? lvlName(level.v) + (n ? "+" + n : "")
        : level.k == "max" ?
            `max(${levelToStringInner(level.v[0])},${levelToStringInner(level.v[1])})` + (n ? "+" + n : "")
        :   (level.k satisfies "zero", "" + n)
    )
}

export function levelToString(level: Level): string {
    return yellow + levelToStringInner(level) + reset
}

export function levelArgsToString(level: readonly Level[]): string {
    if (level.length == 0) return ""
    return `.{` + level.map(levelToString).join(",") + `}`
}

export type Expr = Readonly<
    | { k: "universe"; level: Level }
    | { k: "ref"; defId: number; levels: readonly Level[] }
    | { k: "sum"; fst: Expr; snd: Expr }
    | { k: "pair"; fst: Expr; snd: Expr }
    | { k: "prod"; arg: Expr; ret: Expr }
    | { k: "func"; ret: Expr }
    | { k: "app"; f: Expr; x: Expr }
    | { k: "var"; var: number } // de bruijn indices
    | { k: "axiom"; type: Expr }
>

/** Checks if `varIndex` is ever mentioned in `expr`. */
export function refs(expr: Expr, varIndex: number): boolean {
    return (
        expr.k == "universe" ? false
        : expr.k == "sum" ? refs(expr.fst, varIndex) || refs(expr.snd, varIndex + 1)
        : expr.k == "pair" ? refs(expr.fst, varIndex) || refs(expr.snd, varIndex)
        : expr.k == "prod" ? refs(expr.arg, varIndex) || refs(expr.ret, varIndex + 1)
        : expr.k == "func" ? refs(expr.ret, varIndex + 1)
        : expr.k == "ref" ? false
        : expr.k == "app" ? refs(expr.f, varIndex) || refs(expr.x, varIndex)
        : expr.k == "var" ? expr.var == varIndex
        : (expr.k satisfies "axiom", refs(expr.type, varIndex))
    )
}

const enum Prec {
    Atom, // X
    Application, // X Y
    TrivialSum, // X × Y
    Binder, // ∑(x: X). Y
}

export function str(mod: Module, depth: number, expr: Expr): [string, Prec] {
    if (expr.k == "universe") return [yellow + "U" + levelToString(expr.level) + reset, Prec.Atom]

    if (expr.k == "sum") {
        let [fst, fstp] = str(mod, depth, expr.fst)
        let [snd, sndp] = str(mod, depth + 1, expr.snd)

        if (refs(expr.snd, 0)) {
            return [`∑(${varName(depth)}: ${fst}). ${snd}`, Prec.Binder]
        }

        if (fstp > Prec.TrivialSum) fst = `(${fst})`
        if (sndp >= Prec.TrivialSum) snd = `(${snd})`
        return [`${fst} × ${snd}`, Prec.TrivialSum]
    }

    if (expr.k == "pair") {
        let ret = "("

        while (expr.k == "pair") {
            let [fst, fstp] = str(mod, depth, expr.fst)
            if (fstp > Prec.TrivialSum) fst = `(${fst})`

            ret += fst + ", "
        }

        let [snd, sndp] = str(mod, depth, expr)
        if (sndp > Prec.TrivialSum) snd = `(${snd})`

        ret += snd

        return [ret + ")", Prec.Atom]
    }

    if (expr.k == "prod") {
        let [arg, argp] = str(mod, depth, expr.arg)
        let [ret, retp] = str(mod, depth + 1, expr.ret)

        if (refs(expr.ret, 0)) {
            return [`(${varName(depth)}: ${arg}) -> ${ret}`, Prec.Binder]
        }

        if (argp >= Prec.Binder) arg = `(${arg})`
        if (retp > Prec.Binder) ret = `(${ret})`

        return [`${arg} -> ${ret}`, Prec.Binder]
    }

    if (expr.k == "func") {
        return [`λ${varName(depth)}. ${str(mod, depth + 1, expr.ret)[0]}`, Prec.Binder]
    }

    if (expr.k == "ref") {
        return [defName(mod, expr.defId) + levelArgsToString(expr.levels), Prec.Atom]
    }

    if (expr.k == "app") {
        let [f, fp] = str(mod, depth, expr.f)
        let [x, xp] = str(mod, depth, expr.x)

        if (fp > Prec.Application) f = `(${f})`
        if (xp >= Prec.Application) x = `(${x})`

        return [`${f} ${x}`, Prec.Application]
    }

    if (expr.k == "var") {
        return [varName(depth - expr.var - 1), Prec.Atom]
    }

    expr.k satisfies "axiom"

    return ["axiom", Prec.Atom]
}

export function exprToString(mod: Module, depth: number, expr: Expr): string {
    return str(mod, depth, expr)[0]
}

export type Def = Readonly<{
    name: string
    levels: number
    body: Expr
    type: Expr
}>

export function defToString(mod: Module, def: Def): string {
    return `${blue}${def.name}${reset}${levelArgsToString(
        Array.from({ length: def.levels }, (_, i) => ({ k: "var", v: i })),
    )} ${dim}:${reset} ${exprToString(mod, 0, def.type)} ${dim}:=${reset} ${exprToString(mod, 0, def.body)}`
}

export type Module = readonly Def[]

export function moduleToString(mod: Module): string {
    return mod.map((x) => defToString(mod, x)).join("\n\n")
}

/** Contexts are always assumed to be well-formed. */
export class Context {
    readonly vars: Expr[] = []

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

            throw new Error(`untagged number encountered in error message \`${reason.join("${...}")}\``)
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
                v: [subLevelIntoLevel(base.v[0], args), subLevelIntoLevel(base.v[1], args)],
            }
        : base.k == "var" ? args[base.v]!
        : (base.k satisfies "zero", { k: "zero", v: null })
    )
}

/** Assumes all level variables in `base` are present in `args`. */
export function subLevel(base: Expr, args: Level[]): Expr {
    return (
        base.k == "universe" ? { k: "universe", level: subLevelIntoLevel(base.level, args) }
        : base.k == "ref" ?
            {
                k: "ref",
                defId: base.defId,
                levels: base.levels.map((x) => subLevelIntoLevel(x, args)),
            }
        : base.k == "sum" ?
            {
                k: "sum",
                fst: subLevel(base.fst, args),
                snd: subLevel(base.snd, args),
            }
        : base.k == "pair" ?
            {
                k: "pair",
                fst: subLevel(base.fst, args),
                snd: subLevel(base.snd, args),
            }
        : base.k == "prod" ?
            {
                k: "prod",
                arg: subLevel(base.arg, args),
                ret: subLevel(base.ret, args),
            }
        : base.k == "func" ?
            {
                k: "func",
                ret: subLevel(base.ret, args),
            }
        : base.k == "app" ? { k: "app", f: subLevel(base.f, args), x: subLevel(base.x, args) }
        : base.k == "var" ? base
        : (base.k satisfies "axiom", { k: "axiom", type: subLevel(base.type, args) })
    )
}

/** Assumes variables will not overflow. */
export function offsetVariableIndices(base: Expr, offset: number): Expr {
    return (
        base.k == "universe" || base.k == "ref" ? base
        : base.k == "sum" ?
            {
                k: "sum",
                fst: offsetVariableIndices(base.fst, offset),
                snd: offsetVariableIndices(base.snd, offset),
            }
        : base.k == "pair" ?
            {
                k: "pair",
                fst: offsetVariableIndices(base.fst, offset),
                snd: offsetVariableIndices(base.snd, offset),
            }
        : base.k == "prod" ?
            {
                k: "prod",
                arg: offsetVariableIndices(base.arg, offset),
                ret: offsetVariableIndices(base.ret, offset),
            }
        : base.k == "func" ?
            {
                k: "func",
                ret: offsetVariableIndices(base.ret, offset),
            }
        : base.k == "app" ?
            {
                k: "app",
                f: offsetVariableIndices(base.f, offset),
                x: offsetVariableIndices(base.x, offset),
            }
        : base.k == "var" ? { k: "var", var: base.var + offset }
        : (base.k satisfies "axiom", { k: "axiom", type: offsetVariableIndices(base.type, offset) })
    )
}

function subExpr(
    original: Expr, // original expression
    originalOffset: number, // how much to offset variables in the original expression
    name: number, // the variable we're replacing
    replacement: Expr, // what we're replacing it with
    replacementOffset: number, // how much to offset variables in the replacement
): Expr {
    switch (original.k) {
        case "universe":
            return original

        case "ref":
            return original

        case "sum":
            return {
                k: "sum",
                fst: subExpr(original.fst, originalOffset, name, replacement, replacementOffset),
                snd: subExpr(original.snd, originalOffset, name + 1, replacement, replacementOffset + 1),
            }

        case "pair":
            return {
                k: "pair",
                fst: subExpr(original.fst, originalOffset, name, replacement, replacementOffset),
                snd: subExpr(original.snd, originalOffset, name, replacement, replacementOffset),
            }

        case "prod":
            return {
                k: "prod",
                arg: subExpr(original.arg, originalOffset, name, replacement, replacementOffset),
                ret: subExpr(original.ret, originalOffset, name + 1, replacement, replacementOffset + 1),
            }

        case "func":
            return {
                k: "func",
                ret: subExpr(original.ret, originalOffset, name + 1, replacement, replacementOffset + 1),
            }

        case "app":
            return {
                k: "app",
                f: subExpr(original.f, originalOffset, name, replacement, replacementOffset),
                x: subExpr(original.x, originalOffset, name, replacement, replacementOffset),
            }

        case "var":
            return name == original.var ?
                    offsetVariableIndices(replacement, replacementOffset)
                :   { k: "var", var: original.var + originalOffset }

        case "axiom":
            return {
                k: "axiom",
                type: subExpr(original.type, originalOffset, name, replacement, replacementOffset),
            }
    }
}

export function subInBinder(binderContents: Expr, argument: Expr) {
    return subExpr(
        binderContents,
        -1, // everything inside the binder moves up one level
        0, // we're substituting for what used to be variable 0
        argument,
        0, // the argument doesn't get offset at all at the base level
    )
}

/** Returns whether `index` is an integer in the range `[0, max)`. */
export function isIndexInRange(max: number, index: number): boolean {
    return index === Math.floor(index) && 0 <= index && index < max
}

/** Checks that `level` is well-formed. */
export function checkLevelWF(context: Context, level: Level) {
    switch (level.k) {
        case "zero":
            break

        case "succ":
            checkLevelWF(context, level.v)
            break

        case "max":
            checkLevelWF(context, level.v[0])
            checkLevelWF(context, level.v[1])
            break

        case "var":
            if (!isIndexInRange(context.levels, level.v)) {
                context.e`level #${level.v} is not defined`
            }
            break
    }
}

/**
 * Assuming `lhs` and `rhs` are well-defined and `offset` is an integer, returns whether `lhs <= rhs + offset` for all
 * possible values of ambient level variables.
 */
function isLevelLte(lhs: Level, rhs: Level, offset: number): boolean {
    if (lhs.k == "max") {
        return isLevelLte(lhs.v[0], rhs, offset) && isLevelLte(lhs.v[1], rhs, offset)
    }

    if (rhs.k == "max") {
        return isLevelLte(lhs, rhs.v[0], offset) && isLevelLte(lhs, rhs.v[1], offset)
    }

    // basic test for the above: max(a,b) <= max(a,b)?
    // answer: a <= max(a,b) && b <= max(a,b)
    // answer: (a <= a || a <= b) && (b <= a || b <= b)
    // answer: true

    if (lhs.k == "succ") {
        return isLevelLte(lhs, rhs, offset - 1)
    }

    if (rhs.k == "succ") {
        return isLevelLte(lhs, rhs, offset + 1)
    }

    // basic test for the above: succ(a) <= succ(a)?
    // answer: a <= succ(a) - 1
    // answer: a <= a
    // answer: true

    if (lhs.k == "var" && rhs.k == "var") {
        return (
            lhs.v == rhs.v // unrelated variables can't be compared
            && offset >= 0 // `x <= x - 1` is clearly false
        )
    }

    // `x <= n` is clearly false for any finite `n`, since `x` could be `succ(n)`
    if (lhs.k == "var" && rhs.k == "zero") {
        return false
    }

    // clearly `0 <= x + offset` if `offset` is nonnegative, but it's otherwise not guaranteed
    // also, `0 <= 0 + offset` iff `offset` is nonnegative
    return offset >= 0
}

/** Assuming `lhs` and `rhs` are well-defined, checks that `lhs <= rhs`. */
export function checkLevel(context: Context, lhs: Level, rhs: Level) {
    if (!isLevelLte(lhs, rhs, 0)) {
        context.e`level ${levelToString(lhs)} does not fit in level ${levelToString(rhs)}`
    }
}

/** Assuming `expectedType` is well-formed, checks that `value` is well-formed and has type `expectedType`. */
export function checkType(context: Context, value: Expr, expectedType: Expr) {
    context.todo()
}

/** Checks that `value` is well-formed, and attempts to infer its type. */
export function inferType(context: Context, value: Expr): Expr {
    context.todo()
}

/**
 * Checks that `type` is well-formed, infers it to be some universe type, and attempts to determine that universe's
 * level.
 */
export function extractLevelFromUniverseType(context: Context, type: Expr): Level {
    if (type.k == "universe") {
        checkLevelWF(context, type.level)
        return type.level
    }

    context.todo()
}
