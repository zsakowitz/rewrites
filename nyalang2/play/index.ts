import { dim, reset } from "../ansi"
import { File } from "../impl/pos"
import { _try } from "../impl/test"
import { exprVal } from "../script/eval"
import { parseExpr } from "../script/parse"
import { scan } from "../script/scan"

_try(({ ctx, block }) => {
  const source = new File("repl", "45~3")
  const ret = scan(source)
  const expr = parseExpr(ret)
  console.log(dim + "[ast]" + reset, expr)
  const val = exprVal(expr, block)
  console.log(dim + "[val]" + reset, val)
  const runtime = val.runtime(ctx)
  console.log(dim + "[jsc]" + reset, runtime)
  const evald = (0, eval)(`(${runtime})`)
  console.log(dim + "[evl]" + reset, evald)
})
