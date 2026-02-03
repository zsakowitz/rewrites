import { Game } from "."
import * as Z from "../../parsers/parser-3"
import { Any } from "./game/any"
import { Inv } from "./game/inv"
import { Nim } from "./game/nim"
import { Value } from "./value"

interface Types {
    bool: boolean
    val: Value
    game: Game
}

class V<K extends keyof Types = keyof Types> {
    constructor(
        readonly ty: K,
        readonly value: Types[K],
    ) {}

    of<L extends keyof Types>(ty: L): Types[L] {
        if ((this.ty as any) != ty) {
            throw new Error(`Expected item of type '${ty}'.`)
        }
        return this.value as Types[L]
    }

    log() {
        switch (this.ty) {
            case "bool":
                console.log(this.of("bool"))
                break

            case "val":
                this.of("val").log()
                break

            case "game":
                console.log(Bun.inspect(this.of("game"), { depth: 5 }))
        }
    }
}

type P = Z.Parser<V>

const nim = Z.regex(/^nim(\d+)/, (_, d) => new V("game", new Nim(+d)))
const int = Z.Digits.map((d): V => new V("val", Value.int(+d)))
const star = Z.regex(/^\*(\d+)/, (_, d) => new V("val", Value.star(+d)))
const surreal: P = Z.deferred(() =>
    Z.sequence(Z.text("{"), list, Z.text("|"), list, Z.text("}")).map(
        ([, lhs, , rhs]) => new V("val", new Value(lhs, rhs)),
    ),
)
const paren: P = Z.deferred(() =>
    Z.sequence(Z.text("("), expr, Z.text(")")).key(1),
)
const eval_: P = Z.deferred(() =>
    Z.sequence(Z.text("eval"), expr)
        .key(1)
        .map(
            (x) =>
                new V(
                    "val",
                    x.ty == "val" ? x.of("val") : x.of("game").value(),
                ),
        ),
)
const atom = Z.any(nim, int, star, surreal, paren, eval_)
const negated: P = Z.any(
    atom,
    Z.text("-")
        .and(Z.deferred(() => negated))
        .map((x) =>
            x.ty == "game" ?
                new V("game", new Inv(x.of("game")))
            :   new V("val", x.of("val").neg()),
        ),
)
const sum: P = Z.sequence(negated, Z.many(Z.text("+").and(negated))).map(
    ([lhs, rhs]) =>
        rhs.reduce(
            (a, b) => new V("game", new Any(a.of("game"), b.of("game"))),
            lhs,
        ),
)
const expr: P = sum
const list = Z.sepBy(
    expr.map((x) => x.of("val")),
    Z.text(","),
)

export function parse(text: string) {
    const actual = text.replaceAll(/\s*/g, "")
    const result = expr.parse(Z.init(actual))
    if (!result.ok || result.index != actual.length) {
        throw new Error(`Cannot understand '${text}'.`)
    }
    return result.data
}

export function s(text: TemplateStringsArray) {
    const v = parse(text[0]! ?? "")
    v.log()
}

s`-4`
