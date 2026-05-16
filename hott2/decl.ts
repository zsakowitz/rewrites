export type Level = Readonly<
    | { k: "zero"; v: null }
    | { k: "succ"; v: Level }
    | { k: "var"; v: number }
    | { k: "max"; v: readonly [Level, Level] }
>

export type Expr = Readonly<
    | { k: "universe"; level: Level }
    | { k: "var"; var: number }
    | { k: "sum"; arg: Expr; body: Expr }
    | { k: "pair"; fst: Expr; snd: Expr }
    | { k: "prod"; arg: Expr; body: Expr }
    | { k: "func"; ret: Expr }
    | { k: "app"; f: Expr; x: Expr }
    | { k: "ref"; defId: number; levels: readonly Level[] }
>

export interface ComputationalRule {
    readonly args: number
    exec(levels: readonly Level[], args: readonly Expr[]): Expr | null
}

export type DefBody = Readonly<
    | { axiom: false; body: Expr }
    | { axiom: true; body: ComputationalRule | null }
>

export interface Def {
    readonly name: string
    readonly levelParams: number
    readonly type: Expr | null
    readonly body: DefBody
}

export type Module = readonly Def[]
