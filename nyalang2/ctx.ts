import type { Block } from "./block"
import { issue } from "./error"
import { ident, type IdGlobal } from "./id"
import type { Pos } from "./pos"
import { ValString, type Val } from "./val"

export class Ctx {
  constructor(
    readonly block: Block,
    readonly pos: Pos,
  ) {}

  get source() {
    return this.block.source
  }

  set source(v) {
    this.block.source = v
  }

  get target() {
    return this.block.target
  }

  get scope() {
    return this.block.scope
  }

  get root() {
    return this.block.scope.root
  }

  o(text: TemplateStringsArray, ...args: Val[]): ValString {
    let ret = text[0]!
    for (let i = 1; i < text.length; i++) {
      ret += `(`
      ret += this.target.x(this, args[i - 1]!)
      ret += `)`
      ret += text[i]!
    }
    return new ValString(ret)
  }

  // doesn't yet handle broadcasting and lists
  call(name: string | IdGlobal, args: Val[]): Val {
    if (typeof name == "string") {
      name = ident(name)
    }

    const fns = this.block.scope.fns(name)
    const cx = this.root.coerce
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i]!
      if (
        fn.args.length == args.length &&
        args.every((x, i) => cx.can(x.ty, fn.args[i]!))
      ) {
        return fn.exec(
          args.map((x, i) => cx.map(this, x, fn.args[i]!)),
          this,
        )
      }
    }

    issue(
      `No overload 'fn ${name.label}(${args.map((x) => x.ty).join(", ")})' exists.`,
      this.pos,
    )
  }

  issue(reason: string): never {
    issue(reason, this.pos)
  }
}
