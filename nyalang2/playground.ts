import { TARGET_JS } from "./env-js"
import { Env } from "./ext"
import { ScopeRoot } from "./scope"
import { Ty } from "./ty"

const env = new Env(TARGET_JS, new ScopeRoot())
const ctx = env.ctx()

const tagHello = ctx.tag("hello")
const elVoid = ctx.unit(Ty.Void)
const symHelloVoid = TARGET_JS.symJoin(ctx, tagHello, elVoid)

console.log({ tagHello, elVoid, symHelloVoid })
