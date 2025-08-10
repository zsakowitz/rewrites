import { TARGET_JS } from "./env-js"
import { Env } from "./ext"
import { ScopeRoot } from "./scope"

const env = new Env(TARGET_JS, new ScopeRoot())
const ctx = env.ctx()

const val = TARGET_JS.tupleJoin(ctx, [ctx.num("4.78"), ctx.void()])
const x = ctx.runtime(val)

console.log(x)
