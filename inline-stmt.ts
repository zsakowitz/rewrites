const RET_RETURN = Symbol()
const RET_AS_STMT = Symbol()

type Ret = typeof RET_RETURN | typeof RET_AS_STMT | string

Object.prototype.toString = function () {
  console.log(this)
  return "[object Object]"
}

let vn = 0

function randomVar() {
  return "vx" + vn++
}

class Block {
  text = ""

  push(text: string) {
    this.text += text
  }

  braced(expr: Expr, ret: Ret) {
    this.text += "{\n  "
    const inner = new Block()
    expr.write(this, ret)
    this.text += inner.text.split("\n").join("\n  ")
    this.text += "\n}\n"
  }
}

abstract class Expr {
  abstract write(block: Block, ret: Ret): void
  abstract writeExpr(block: Block): string
}

type Params = readonly [text: TemplateStringsArray, ...interps: Expr[]]

class Vanilla extends Expr {
  static of(text: TemplateStringsArray, ...interps: Expr[]) {
    return new Vanilla(text, interps)
  }

  constructor(readonly text: TemplateStringsArray, readonly interps: Expr[]) {
    super()
  }

  write(block: Block, ret: Ret) {
    let text = this.text[0]!
    for (let i = 1; i < this.text.length; i++) {
      text += `(${this.interps[i - 1]!.writeExpr(block)})`
      text += this.text[i]!
    }

    switch (ret) {
      case RET_RETURN:
        block.push(`return (${text});`)
        break

      case RET_AS_STMT:
        block.push(text + ";")
        break

      default:
        block.push(`${ret} = (${text});`)
        break
    }
  }

  writeExpr(block: Block): string {
    let text = this.text[0]!
    for (let i = 1; i < this.text.length; i++) {
      text += `(${this.interps[i - 1]!.writeExpr(block)})`
      text += this.text[i]!
    }
    return text
  }
}

class Return extends Expr {
  constructor(readonly value: Expr) {
    super()
  }

  write(ctx: Block) {
    this.value.write(ctx, RET_RETURN)
  }

  writeExpr(block: Block): string {
    this.value.write(block, RET_RETURN)
    return "0"
  }
}

class Empty extends Expr {
  write(block: Block, ret: Ret) {
    switch (ret) {
      case RET_RETURN:
        block.push(`return;`)
        break

      case RET_AS_STMT:
        break

      default:
        block.push(`${ret} = void 0;`)
        break
    }
  }

  writeExpr(): string {
    return "void 0"
  }
}

class If extends Expr {
  constructor(
    readonly condition: Expr,
    readonly value: Expr,
    readonly alt?: Expr,
  ) {
    super()
  }

  writeExpr(block: Block): string {
    const ret = randomVar()
    block.push(`let ${ret};`)
    block.push(`if (${this.condition.writeExpr(block)})`)
    block.braced(this.value, ret)
    if (this.alt) {
      block.push(`else`)
      block.braced(this.alt, ret)
    }
    return ret
  }

  write(block: Block, ret: Ret) {
    block.push(`if (${this.condition.writeExpr(block)})`)
    block.braced(this.value, ret)
    if (this.alt) {
      block.push("else")
      block.braced(this.alt, ret)
    } else {
      switch (ret) {
        case RET_RETURN:
          block.push(`else return;`)
          break

        case RET_AS_STMT:
          break

        default:
          block.push(`else ${ret} = void 0;`)
          break
      }
    }
  }
}

class AndAnd extends Expr {
  constructor(readonly a: Expr, readonly b: Expr) {
    super()
  }

  write(block: Block, ret: Ret): void {
    switch (ret) {
      case RET_RETURN: {
        const ret = randomVar()
        block.push(`var ${ret} = ${this.a.writeExpr(block)};\n`)
        block.push(`if (!${ret}) return ${ret};\n`)
        block.push(`return ${this.b.writeExpr(block)};\n`)
        break
      }

      case RET_AS_STMT:
        block.push(`if (${this.a.writeExpr(block)})`)
        block.braced(this.b, RET_AS_STMT)
        break

      default:
        block.push(`var ${ret} = ${this.a.writeExpr(block)};\n`)
        block.push(`if (${ret})`)
        block.braced(this.b, ret)
    }
  }

  writeExpr(block: Block): string {
    const ret = randomVar()
    this.write(block, ret)
    return ret
  }
}

type JsArgs = Params | [Expr]

function js(...args: JsArgs) {
  if (args[0] instanceof Expr) {
    return args[0]
  } else {
    return Vanilla.of(...(args as Params))
  }
}

function ret(...args: JsArgs) {
  return new Return(js(...args))
}

function if_(...condition: JsArgs) {
  return (...body: JsArgs) => new If(js(...condition), js(...body))
}

function ifElse(...condition: JsArgs) {
  return (...body: JsArgs) =>
    (...alt: JsArgs) =>
      new If(js(...condition), js(...body), js(...alt))
}

function aa(...a: JsArgs) {
  return (...b: JsArgs) => new AndAnd(js(...a), js(...b))
}

const expr = ifElse`${aa`2<3``4>5`}``console.log("hello world")``console.log("we're broken")`

console.log(expr)

let block
let value
console.log({
  ret: ((block = new Block()), expr.write(block, RET_RETURN), block.text),
  stmt: ((block = new Block()), expr.write(block, RET_AS_STMT), block.text),
  world: ((block = new Block()), expr.write(block, "world"), block.text),

  expr:
    ((block = new Block()),
    (value = expr.writeExpr(block)),
    { block: block.text, value: value }),
})
