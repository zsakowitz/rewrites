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

for (let i = 0; i < 20; i++)
  env.root.pushFn(
    ident("+"),
    new Fn([ident("x"), ident("y")], [Int, Int], Int, ([a, b], ctx) => {
      if (a.const && b.const) {
        return new Val(
          ((a.value as number) + (b.value as number)) | 0,
          Int,
          true,
        )
      } else {
        return ctx.o`${a}+${b}|0`.ty(Int)
      }
    }),
  )

env.root.pushFn(
  ident("+"),
  new Fn([ident("x"), ident("y")], [Num, Num], Num, ([a, b], ctx) => {
    if (a.const && b.const) {
      return new Val((a.value as number) + (b.value as number), Num, true)
    } else {
      return ctx.o`${a}+${b}`.ty(Num)
    }
  }),
)

const times = []

for (let i = 0; i < 10; i++) {
  const ctx = env.ctx()
  const a = env.target.createInt("23")
  const b = env.target.createNum("5.7")
  const r = []
  const t = Date.now()
  for (let i = 0; i < 1e6; i++) {
    r.push(ctx.call("+", [a, b]))
  }
  times.push(Date.now() - t)
  console.log(r)
}
console.error(times.reduce((a, b) => a + b, 0) / times.length)
