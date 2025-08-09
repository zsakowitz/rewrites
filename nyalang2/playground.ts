import { Env } from "./ext"
import { Fn } from "./fn"
import { ident } from "./id"
import { TARGET_JS } from "./play/env-js"
import { Pos } from "./pos"
import { ScopeRoot } from "./scope"
import { Ty } from "./ty"
import { Val } from "./val"

const { Int, Num, Bool } = Ty

const pos = Pos.native()
const env = new Env(TARGET_JS, new ScopeRoot())

env.root.coerce.add(pos, Int, Num, (v) => v.transmute(Num))

env.root.pushFn(
  ident("+"),
  new Fn([Num, Num], Num, ([a, b], ctx) => {
    if (a.const && b.const) {
      return new Val((a.value as number) + (b.value as number), Num, true)
    } else {
      return ctx.o`${a}+${b}`.ty(Num)
    }
  }),
)

const ctx = env.ctx()
const a = env.target.createInt("23")
const b = env.target.createNum("5.7")
const ret = ctx.call("+", [a, b])
const t = ctx.target.tupleJoin(ctx, [a, b])
console.log(t)
