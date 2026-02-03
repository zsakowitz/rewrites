// A parser and evaluator for boolean logic and sequent calculus.

export type Expression =
    | { readonly type: "atomic"; readonly value: string }
    | { readonly type: "true" }
    | { readonly type: "false" }
    | {
          readonly type: "and"
          readonly left: Expression
          readonly right: Expression
      }
    | {
          readonly type: "or"
          readonly left: Expression
          readonly right: Expression
      }
    | {
          readonly type: "not"
          readonly value: Expression
      }
