import { Const } from "./const"
import { TARGET_JS } from "./env-js"
import { Env } from "./ext"
import { Param, ParamKind, Params } from "./param"
import { ScopeRoot } from "./scope"
import { T, Ty } from "./ty"
import { Val } from "./val"

const { Bool, Int, Num, Void } = Ty

const env = new Env(TARGET_JS, new ScopeRoot())
const ctx = env.ctx()
env.root.coerce.add(ctx.pos, Int, Num, (val) => val.transmute(Num))

const params = new Params(ctx, null)
const N = new Const(new Param("N", ParamKind.Const), Int)
const val = new Val(
  [ctx.int("2"), ctx.int("7"), ctx.int("5")],
  new Ty(T.ArrayFixed, { el: Int, size: [new Const(3, Int)] }),
  true,
)
const expect = new Ty(T.ArrayFixed, { el: Num, size: [N] })

if (ctx.root.coerce.can(val.ty, expect, params)) {
  const ret = ctx.root.coerce.map(ctx, val, expect, params)
  console.log(params)
  console.log(ret)
} else {
  console.log(`cannot coerce '${val}' -> '${expect}'`)
}
