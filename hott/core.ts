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
    return "uvw"[n] ?? `#` + n
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
        : (expr.k satisfies "var", expr.var == varIndex)
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

    expr.k satisfies "var"

    return [varName(depth - expr.var - 1), Prec.Atom]
}

export function exprToString(mod: Module, depth: number, expr: Expr): string {
    return str(mod, depth, expr)[0]
}

export interface AxiomComputationalRule {
    readonly args: number
    exec(levels: Level[], args: Expr[]): Expr | null
}

export type DefBody = Readonly<{ k: false; v: Expr } | { k: true; v: AxiomComputationalRule | null }>

export type Def = Readonly<{
    name: string
    levels: number
    type: Expr
    body: DefBody
}>

export function defToString(mod: Module, def: Def): string {
    return `${blue}${def.name}${reset}${levelArgsToString(
        Array.from({ length: def.levels }, (_, i) => ({ k: "var", v: i })),
    )} ${dim}:${reset} ${exprToString(mod, 0, def.type)} ${dim}:=${reset} ${
        def.body.k ? "axiom" + (def.body.v ? " with rule" : "") : exprToString(mod, 0, def.body.v)
    }`
}

export type Module = readonly Def[]

export function moduleToString(mod: Module): string {
    return mod.map((x) => defToString(mod, x)).join("\n\n")
}

/**
 * Contexts are always assumed to be well-formed. This means all definitions before `def` are well-formed, no entry in
 * `vars` refers to an unbound variable, and `levels` matches the number of levels in the associated definition.
 */
export class Context {
    readonly vars: Expr[] = []

    constructor(
        readonly mod: Module,
        readonly def: number,
        readonly levels: number,
    ) {}

    /** Checks that `index` is a well-formed variable index, and returns its type. */
    getVarType(index: number): Expr {
        if (!isIndexInRange(this.vars.length, index)) {
            this.e`Variable $${index} is not defined.`
        }

        return this.vars[this.vars.length - index]!
    }

    e(reason: TemplateStringsArray, ...args: (number | string | Expr)[]): never {
        let ret = ""

        for (let i = 0; i < args.length; i++) {
            const reasonText = reason[i]!
            const arg = args[i]!

            if (typeof arg == "object") {
                ret += reasonText + "`" + exprToString(this.mod, this.vars.length, arg) + "`"
                continue
            }

            if (typeof arg == "string") {
                ret += reasonText + arg
                continue
            }

            if (reasonText.endsWith("$")) {
                ret += reasonText.slice(0, -1) + varName(arg)
                continue
            }

            if (reasonText.endsWith("#")) {
                ret += reasonText.slice(0, -1) + yellow + lvlName(arg) + reset
                continue
            }

            if (reasonText.endsWith("@")) {
                ret += reasonText.slice(0, -1) + defName(this.mod, arg)
                continue
            }

            if (reasonText.endsWith(".")) {
                ret += reasonText.slice(0, -1) + arg
                continue
            }

            throw new Error(`untagged number encountered in error message \`${reason.join("${...}")}\``)
        }

        throw new Error(`(in ${defName(this.mod, this.def)}) ` + ret + reason[reason.length - 1]!)
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
        : (base.k satisfies "var", base)
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
        :   (base.k satisfies "var", { k: "var", var: base.var + offset })
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
 * Assuming `lhs` and `rhs` are well-formed and `offset` is an integer, returns whether `lhs <= rhs + offset` for all
 * possible values of ambient level variables.
 */
function isLevelLte(lhs: Level, rhs: Level, offset: number): boolean {
    return (
        (lhs.k == "max" && isLevelLte(lhs.v[0], rhs, offset) && isLevelLte(lhs.v[1], rhs, offset))
        || (rhs.k == "max" && (isLevelLte(lhs, rhs.v[0], offset) || isLevelLte(lhs, rhs.v[1], offset)))
        || (lhs.k == "succ" && isLevelLte(lhs.v, rhs, offset - 1))
        || (rhs.k == "succ" && isLevelLte(lhs, rhs.v, offset + 1))
        || (lhs.k == "var" && rhs.k == "var" && lhs.v == rhs.v && offset >= 0)
        || (lhs.k == "zero" && offset >= 0)
    )
}

/** Assuming `lhs` and `rhs` are well-formed, checks that `lhs <= rhs`. */
export function checkLevel(context: Context, lhs: Level, rhs: Level) {
    if (!isLevelLte(lhs, rhs, 0)) {
        context.e`level ${levelToString(lhs)} does not fit in level ${levelToString(rhs)}`
    }
}

/** Checks that a reference expression is well-formed, and returns the referenced definition. */
export function checkRef(context: Context, ref: Expr & { k: "ref" }): Def {
    if (!isIndexInRange(context.mod.length, ref.defId)) {
        context.e`@${ref.defId} does not exist`
    }

    if (!isIndexInRange(context.def, ref.defId)) {
        context.e`@${ref.defId} is defined after this expression`
    }

    const def = context.mod[ref.defId]!

    if (def.levels != ref.levels.length) {
        context.e`@${ref.defId} expected ${def.levels} levels, but received ${ref.levels.length}`
    }

    for (let i = 0; i < ref.levels.length; i++) {
        checkLevelWF(context, ref.levels[i]!)
    }

    return def
}

/** Assuming `expectedType` is well-formed, checks that `value` is well-formed and has type `expectedType`. */
export function checkType(context: Context, value: Expr, expectedType: Expr) {
    context.todo()
}

/** Checks that `value` is a well-formed type and returns the smallest level known to contain it. */
export function inferLevelOfType(context: Context, value: Expr): Level {
    // U_x : U_(succ x)
    if (value.k == "universe") {
        checkLevelWF(context, value.level)
        return { k: "succ", v: value.level }
    }

    // (∑(x: A). B): U_max(levelof A, levelof B)
    if (value.k == "sum") {
        const fstLevel = inferLevelOfType(context, value.fst)
        context.vars.push(value.fst)
        const sndLevel = inferLevelOfType(context, value.snd)
        context.vars.pop()
        return { k: "max", v: [fstLevel, sndLevel] }
    }

    // (∏(x: A). B): U_max(levelof A, levelof B)
    if (value.k == "prod") {
        const argLevel = inferLevelOfType(context, value.arg)
        context.vars.push(value.arg)
        const retLevel = inferLevelOfType(context, value.ret)
        context.vars.pop()
        return { k: "max", v: [argLevel, retLevel] }
    }

    if (value.k == "pair" || value.k == "func") {
        return context.e`expected type, found ${value}`
    }

    if (value.k == "var") {
        const varType = context.getVarType(value.var)
        return extractLevelFromUniverseType(context, varType)
    }

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

    if (type.k == "ref") {
        const def = checkRef(context, type)
        context.todo()
    }

    if (type.k == "app") {
        context.todo()
    }

    // variables `x: U` do not need to be checked, since they could theoretically be some non-universe type like `0`

    return context.e`${type} is not a universe`
}
