import { stdin, stdout } from "node:process"
import { createInterface } from "node:readline"
import { dim as d, reset as r, red, reset } from "../ansi"
import { ScriptError } from "../impl/error"
import { File } from "../impl/pos"
import { createEnv } from "../impl/std"
import { exprVal } from "../script/eval"
import { parseExpr } from "../script/parse"
import { scan } from "../script/scan"

const env = createEnv()

const X = [
  `${d}[ast]${r} syntax tree`,
  `${d}[val]${r} internal repr`,
  `${d}[jsc]${r} generated JS`,
  `${d}[evl]${r} eval'd value`,
]
console.log(X.join("    "))
console.write("\n> ")
for await (const line of createInterface({ input: stdin, output: stdout })) {
  try {
    const ctx = env.ctx()
    const source = new File("repl", line)
    const ret = scan(source)
    const expr = parseExpr(ret)
    if (ret.i < ret.p.length) {
      ctx.issue(`Unable to parse expression.`)
    }
    console.log(d + "[ast]" + r, expr)
    const val = exprVal(expr, ctx.block)
    console.log(d + "[val]" + r, val)
    const runtime = val.runtime(ctx)
    console.log(d + "[jsc]" + r, ctx.block.source + (runtime ?? "null"))
    const evald = (0, eval)(`${ctx.block.source};(${runtime})`)
    console.log(d + "[evl]" + r, evald)
  } catch (e) {
    console.log(
      red
        + d
        + "[err] "
        + r
        + red
        + (e instanceof ScriptError ? e.message : e)
        + reset,
    )
  }
  console.write("\n> ")
}
