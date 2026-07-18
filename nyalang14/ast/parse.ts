import { map, match, matchWithSpan, onlyIf, seq, token, type Parser } from "./parse-combinators"
import type { Span } from "./span"
import { T } from "./token"

type Expr = { s: Span } & (
    | { k: "lit-num"; v: bigint }
    | { k: "lit-prop"; v: { name: string; args: Expr[] | null } }
    | { k: "error"; v: null }
    | { k: "ident"; v: string }
    | { k: "cf-return"; v: Expr }
    | { k: "cf-if"; v: { condition: Expr; bif: Expr; belse: Expr | null } }
    | { k: "cf-while"; v: { condition: Expr; body: Expr } }
)

export function kv<const K, V>(k: K, v: V): { k: K; v: V } {
    return { k, v }
}

const expr: Parser<Expr> = (s) => exprAtom(s)

const exprAtom: Parser<Expr> = matchWithSpan<Expr>({
    null: () => ({ k: "error", v: null }),
    [T.LInt]: map(token(T.LInt), (span) => kv("lit-num", BigInt(span.text()))),
    [T.Ident]: map(token(T.Ident), (span) => kv("ident", span.text())),
    [T.KReturn]: map(seq([token(T.KReturn), expr]), (v) => kv("cf-return", v[1])),
    [T.KIf]: map(
        seq([
            token(T.KIf),
            token(T.LParen),
            expr,
            token(T.RParen),
            expr,
            onlyIf(T.KElse, seq([token(T.KElse), expr])),
        ]),
        ([, , condition, , bif, belse]) =>
            kv("cf-if", { condition, bif, belse: belse?.[1] ?? null }),
    ),
    [T.KWhile]: map(
        seq([token(T.KWhile), token(T.LParen), expr, token(T.RParen), expr]),
        ([, , condition, , body]) => kv("cf-while", { condition, body }),
    ),
    [T.Dot]: (s) => {
        s.idx++

        return match({
            [T.LBrace]: b,
        })()
    },
})
