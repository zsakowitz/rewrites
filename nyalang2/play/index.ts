import { _try } from "../impl/test"
import { parseExpr } from "../script/expr"
import { scan } from "../script/scan"

_try(({ block }) => {
  const ret = scan("repl.nya", "(?45.6,null)")
  const expr = parseExpr(ret)
  const val = expr.evalVal(block)
  console.log(val)
})
