import * as Z from "../../parsers/parser-3"
import { Value } from "./value"

const int = Z.Digits.map((d) => Value.int(+d))
const star = Z.regex(/^\*(\d+)/, (_, d) => Value.star(+d))
const surreal: Z.Parser<Value> = Z.deferred<Value>(() =>
  Z.sequence(Z.text("{"), list, Z.text("|"), list, Z.text("}")).map(
    ([, lhs, , rhs]) => new Value(lhs, rhs),
  ),
)
const atom = Z.any(int, star, surreal)
const negated: Z.Parser<Value> = Z.any(
  atom,
  Z.text("-")
    .and(Z.deferred(() => negated))
    .map((x) => x.neg()),
)
const num: Z.Parser<Value> = negated
const list = Z.sepBy(num, Z.text(","))

export function parse(text: string): Value {
  const actual = text.replaceAll(/\s*/g, "")
  const result = num.parse(Z.init(actual))
  if (!result.ok || result.index != actual.length) {
    throw new Error(`Cannot understand '${text}'.`)
  }
  return result.data
}

export function s(text: TemplateStringsArray) {
  return parse(text[0]! ?? "")
}
