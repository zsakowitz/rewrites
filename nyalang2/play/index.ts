import { File } from "../impl/pos"
import { _try } from "../impl/test"
import { evalVal } from "../script/eval"
import { parseExpr } from "../script/parse"
import { scan } from "../script/scan"

_try(({ ctx, block }) => {
  const source = new File("repl.nya", "[2,7]")
  const ret = scan(source)
  const expr = parseExpr(ret)
  console.log(expr)
  const val = evalVal(expr, block)
  console.log(val)
  const runtime = val.runtime(ctx)
  console.log(runtime)
})
