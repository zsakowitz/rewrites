import { parseExpr } from "../script/expr"
import { scan } from "../script/scan"

const ret = scan("repl.nya", "(?45.6,null)")
const expr = parseExpr(ret)
console.log(expr)
