import { TARGET_JS } from "./env-js"
import { Env } from "./ext"
import { Param, ParamKind, Params } from "./param"
import { ScopeRoot } from "./scope"
import { T, Ty } from "./ty"

const { Bool, Int, Num, Void } = Ty

const env = new Env(TARGET_JS, new ScopeRoot())
const ctx = env.ctx()

env.root.coerce.add(ctx.pos, Int, Num, (val) => val.transmute(Num))

const val = ctx.tuple([ctx.int("-2"), ctx.void()])
const U = new Ty(T.Param, new Param("U", ParamKind.Ty))
const exp = new Ty(T.Tuple, [Num, U])

console.time()
for (let i = 0; i < 1e6; i++) {
  const params = new Params(ctx)
  const can = ctx.root.coerce.can(val.ty, exp, params)
  if (can) {
    const ret = ctx.root.coerce.map(ctx, val, exp, params)
  }
}
console.timeEnd()
const params = new Params(ctx)
const can = ctx.root.coerce.can(val.ty, exp, params)
if (can) {
  const ret = ctx.root.coerce.map(ctx, val, exp, params)
  console.log(params, ret)
} else {
  console.log("not possible")
}
