import { TARGET_JS } from "./env-js"
import { Env } from "./ext"
import { ScopeRoot } from "./scope"
import { T, Ty } from "./ty"

const { Bool, Int, Num, Void } = Ty

const env = new Env(TARGET_JS, new ScopeRoot())
const ctx = env.ctx()

env.root.coerce.add(ctx.pos, Int, Num, (val) => val.transmute(Num))

const val = ctx.tuple([ctx.int("-2"), ctx.void()])
const exp = new Ty(T.Tuple, [Num, Void])
const can = ctx.root.coerce.can(val.ty, exp)
if (can) {
  const ret = ctx.root.coerce.map(ctx, val, exp)
  console.log(ret)
} else {
  console.log("no")
}
