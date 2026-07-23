import type { Value } from "../../../math/game/value"
import type { Errors } from "./error"
import type { Tokens } from "./token"

export class ParseContext {
    index = 0

    constructor(
        readonly e: Errors,
        readonly tokens: Tokens,
    ) {}
}

export type OpPrefix = "!" | "~" | "-" | "/"

// prettier-ignore
export type OpInfix =
    | "+"  | "+%" | "-" | "-%" | "*"  | "*%" | "/"  | "%"
    | "~"  | "&"  | "|" | "<<" | ">>"
    | "==" | "!=" | "<" | ">"  | "<=" | ">=" | "==" | "!="

export type Ident = { s: number; e: number; name: string }
export type Label = { s: number; e: number; name: string } | null
export type Pat = { s: number; e: number; k: "else"; v: null } | Expr
export type ForInput =
    | { s: number; e: number; k: "range"; v: { lhs: Expr; rhs: Expr | null } }
    | { s: number; e: number; k: "plain"; v: Expr }
export type TestName =
    | { s: number; e: number; k: "lit-string"; v: string }
    | { s: number; e: number; k: "ident"; v: string }

export type Expr = { s: number; e: number } & (
    | { k: "lit-int"; v: bigint }
    | { k: "lit-float"; v: number }
    | { k: "lit-string"; v: string }
    | { k: "ty-optional"; v: { child: Expr } }
    | { k: "ty-array"; v: { len: Expr | null; child: Expr } }
    | { k: "ty-fn"; v: { args: Expr[]; ret: Expr } }
    | { k: "ns-struct"; v: { extern: boolean; child: Decl[] } }
    | { k: "ns-enum"; v: { extern: boolean; tag: Expr | null; child: Decl[] } }
    | { k: "ns-union"; v: { child: Decl[] } }
    | { k: "dot-tuple"; v: Expr[] } // .{2, 3}
    | { k: "dot-struct"; v: { name: Ident; value: Expr }[] } // .{a: 2}
    | { k: "dot-field"; v: string } // .a
    | { k: "dot-method"; v: { name: Ident; args: Expr[] } } // .a(2, 3)
    | { k: "dot-call"; v: Expr[] } // .(2, 3)
    | { k: "op-prefix"; v: { name: OpPrefix; arg: Expr } }
    | { k: "op-infix"; v: { name: OpInfix; lhs: Expr; rhs: Expr } }
    | { k: "cf-unreachable"; v: null }
    | { k: "cf-and"; v: { lhs: Expr; rhs: Expr } }
    | { k: "cf-or"; v: { lhs: Expr; rhs: Expr } }
    | { k: "cf-orelse"; v: { lhs: Expr; rhs: Expr } }
    | { k: "cf-if"; v: { cond: Expr; capture: Ident | null; if: Expr; else: Expr | null } }
    | {
          k: "cf-switch"
          v: { input: Expr; arms: { pat: Pat[]; capture: Ident | null; body: Expr }[] }
      }
    | {
          k: "cf-for"
          v: { label: Label; inputs: ForInput[]; capture: Ident[]; body: Expr; else: Expr | null }
      }
    | {
          k: "cf-while"
          v: { label: Label; input: Expr; capture: Ident | null; body: Expr; else: Expr | null }
      }
    | { k: "cf-break"; v: { label: Label; value: Expr | null } }
    | { k: "cf-continue"; v: { label: Label } }
    | { k: "cf-return"; v: { value: Expr | null } }
    | { k: "cf-comptime"; v: Expr }
    | { k: "get-prop"; v: { target: Expr; name: Ident } }
    | { k: "get-method"; v: { target: Expr; name: Ident; args: Expr[] } }
    | { k: "get-index"; v: { target: Expr; index: Expr } }
    | { k: "get-call"; v: { target: Expr; args: Expr[] } }
    | { k: "get-unwrap"; v: { target: Expr } }
    | { k: "block"; v: { label: Label; body: Stmt[] } }
    | { k: "builtin"; v: { name: string; args: Expr[] } }
    | { k: "ident"; v: string }
    | { k: "underscore"; v: null }
)

export type Decl = { s: number; e: number } & (
    | { k: "field-ident"; v: Ident } // a, (could be a field in a tuple or a field name for an enum)
    | { k: "field-expr"; v: Expr } // Map(i32, i32), (must be some kind of tuple field type)
    | { k: "field-plain"; v: { name: Ident; type: Expr; default: Value } } // a: i32 = 4,
    | { k: "comptime"; v: Expr }
    | { k: "test"; v: { name: TestName; body: Expr } }
    | { k: "const"; v: { name: Ident; type: Expr | null; body: Expr } }
    | { k: "var"; v: { name: Ident; type: Expr | null; body: Expr } }
    | {
          k: "fn"
          v: { name: Ident | null; args: { name: Ident; type: Expr }; ret: Expr; body: Expr }
      }
)

export type Stmt = { s: number; e: number } & (
    | { k: "const"; v: { name: Ident; type: Expr | null; body: Expr } }
    | { k: "var"; v: { name: Ident; type: Expr | null; body: Expr } }
    | { k: "expr"; v: Expr }
    | { k: "assign"; v: { lhs: Expr[]; rhs: Expr } }
)
