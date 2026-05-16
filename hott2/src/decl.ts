export type Level = Readonly<
    | { k: "zero"; v: null }
    | { k: "succ"; v: Level }
    | { k: "var"; v: number }
    | { k: "max"; v: readonly [Level, Level] }
>

export type Expr = Readonly<
    | { k: "universe"; v: Level }
    | { k: "cast"; f: Expr; x: Expr } // ensures a certain object has a known type
    | { k: "var"; v: number }
    | { k: "sum"; arg: Expr; body: Expr }
    | { k: "pair"; f: Expr; x: Expr }
    | { k: "prod"; arg: Expr; body: Expr }
    | { k: "func"; v: Expr }
    | { k: "app"; f: Expr; x: Expr }
    | { k: "ref"; defId: number; levels: readonly Level[] }
>

export interface ComputationalRule {
    readonly args: number
    exec(levels: readonly Level[], args: readonly Expr[]): Expr | null
}

export type DefBody = Readonly<
    { axiom: false; body: Expr } | { axiom: true; body: ComputationalRule | null }
>

export interface Def {
    readonly name: string
    readonly levelParams: number
    readonly type: Expr | null
    readonly body: DefBody
}

export type Module = readonly Def[]
