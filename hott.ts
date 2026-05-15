export type Level = Readonly<
    | { k: "var"; v: number }
    | { k: "succ"; v: Level }
    | { k: "zero"; v: null }
    | { k: "max"; v: readonly [Level, Level] }
>

function varName(n: number) {
    return "xyzabcdefghijklmnopqrst"[n] ?? `$` + n
}

function lvlName(n: number) {
    return "uvw"[n] ?? `#` + n
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
    | { k: "prod"; var: number; fst: Expr; snd: Expr }
    | { k: "app"; f: Expr; x: Expr }
    | { k: "var"; var: number }
>

export function exprToString(mod: Module, expr: Expr): string {
    return (
        expr.k == "universe" ? "𝒰" + levelToString(expr.level)
        : expr.k == "sum" ?
            `∑(${varName(expr.var)}: ${exprToString(mod, expr.fst)}). ${exprToString(mod, expr.snd)}`
        : expr.k == "prod" ?
            `∏(${varName(expr.var)}: ${exprToString(mod, expr.fst)}). ${exprToString(mod, expr.snd)}`
        : expr.k == "ref" ?
            (mod[expr.defId] ?
                "@" + mod[expr.defId]!.name
            :   `def@${expr.defId}`) + levelArgsToString(expr.levels)
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
}>

export function defToString(mod: Module, def: Def): string {
    return (
        `@${def.name}${levelArgsToString(Array.from({ length: def.levels }, (_, i) => ({ k: "var", v: i })))} := `
        + exprToString(mod, def.body)
    )
}

export type Module = readonly Def[]

export function moduleToString(mod: Module): string {
    return mod.map((x) => defToString(mod, x)).join("\n\n")
}
