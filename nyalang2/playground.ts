import { Fn } from "./fn"
import { ident } from "./id"
import { FnParamsTempl } from "./param"
import { createEnv } from "./std"
import { Num } from "./ty"
import { Val } from "./val"

const env = createEnv()

env.root.pushFn(
  new Fn(
    ident("+"),
    new FnParamsTempl(),
    [
      { name: ident("x"), ty: Num },
      { name: ident("y"), ty: Num },
    ],
    Num,
    [],
    (ctx, args) => {
      const a = args[0]!
      const b = args[0]!
      if (a.const && b.const) {
        return new Val((a.value as number) + (b.value as number), Num, true)
      } else {
        return ctx.join`${a}+${b}`.ty(Num)
      }
    },
  ),
)

console.time()
const ctx = env.ctx()
const a = ctx.int("23")
const b = ctx.num("5.7")
for (let i = 0; i < 1e6; i++) {
  ctx.call("+", [a, b])
}
console.timeEnd()
