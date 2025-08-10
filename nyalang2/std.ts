import { TARGET_JS } from "./env-js"
import { Env } from "./ext"
import { ScopeRoot } from "./scope"
import { Int, Num } from "./ty"

export function createEnv() {
  const env = new Env(TARGET_JS, new ScopeRoot())
  const ctx = env.ctx()
  env.root.coerce.add(ctx.pos, Int, Num, (val) => val.transmute(Num))
  return env
}
