import { File } from "../impl/pos"
import { _try } from "../impl/test"
import { evalVal } from "../script/eval"
import { parseExpr } from "../script/parse"
import { scan } from "../script/scan"

_try(({ block }) => {
  const source = new File("repl.nya", "[45.6,null]")
  const ret = scan(source)
  const expr = parseExpr(ret)
  console.log(expr)
  const val = evalVal(expr, block)
  console.log(val)
})
