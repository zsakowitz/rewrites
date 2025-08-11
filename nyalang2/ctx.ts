import type { Block } from "./block"
import { issue } from "./error"
import { ident, type IdGlobal } from "./id"
import { type Param } from "./param"
import type { Pos } from "./pos"
import { ArrayEmpty, Ty, Void, type T } from "./ty"
import { Val, ValString } from "./val"

export class Ctx<SymTag = unknown> {
  constructor(
    readonly block: Block<SymTag>,
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

  join(text: TemplateStringsArray, ...args: Val[]): ValString {
    let ret = text[0]!
    for (let i = 1; i < text.length; i++) {
      ret += `(`
      ret += this.target.x(this, args[i - 1]!)
      ret += `)`
      ret += text[i]!
    }
    return new ValString(ret)
  }

  runtime(val: Val): string | null {
    return this.target.x(this, val)
  }

  // doesn't yet handle broadcasting and lists
  callTy(name: IdGlobal | Param, args: Ty[]): Ty | null {
    if (typeof name == "string") {
      name = ident(name)
    }

    const fns = this.block.scope.fns(name)
    const cx = this.root.coerce
    next: for (let i = 0; i < fns.length; i++) {
      const fn = fns[i]!
      if (fn.args.length != args.length) {
        continue next
      }

      const params = fn.params.within(this)
      for (let i = 0; i < fn.args.length; i++) {
        if (!cx.can(args[i]!, fn.args[i]!, params)) {
          continue next
        }
      }

      for (let i = 0; i < fn.where.length; i++) {
        if (!fn.where[i]!.matches(this, params)) {
          continue next
        }
      }

      return fn.ret.with(params)
    }

    return null
  }

  // doesn't yet handle broadcasting and lists
  callVal(name: string | IdGlobal, args: Val[]): Val {
    if (typeof name == "string") {
      name = ident(name)
    }

    const fns = this.block.scope.fns(name)
    const cx = this.root.coerce
    next: for (let i = 0; i < fns.length; i++) {
      const fn = fns[i]!
      if (fn.args.length != args.length) {
        continue next
      }

      const params = fn.params.within(this)
      for (let i = 0; i < fn.args.length; i++) {
        if (!cx.can(args[i]!.ty, fn.args[i]!, params)) {
          continue next
        }
      }

      for (let i = 0; i < fn.where.length; i++) {
        if (!fn.where[i]!.matches(this, params)) {
          continue next
        }
      }

      return fn
        .exec(
          this,
          args.map((x, i) => cx.map(this, x, fn.args[i]!, params)),
        )
        .transmute(fn.ret.with(params))
    }

    this.issue(
      `No overload 'fn ${name.label}(${args.map((x) => x.ty).join(", ")})' exists.`,
    )
  }

  bug(reason: string): never {
    this.issue(`Bug: ` + reason)
  }

  issue(reason: string): never {
    issue(reason, this.pos)
  }

  unreachable(): never {
    this.bug(`This code should never be reached.`)
  }

  todo(): never {
    this.bug(`This code is not implemented yet.`)
  }

  unit<K extends T>(ty: Ty<K>) {
    return Val.unit(ty, this.pos)
  }

  tag(tag: IdGlobal | string): SymTag {
    if (typeof tag == "string") {
      tag = ident(tag)
    }
    return this.target.symTag(this, this.unit(Ty.Sym(tag)))
  }

  bool(value: boolean): Val<T.Bool> {
    return this.target.createBool(this, value)
  }

  int(value: string): Val<T.Int> {
    return this.target.createInt(this, value)
  }

  num(value: string): Val<T.Num> {
    return this.target.createNum(this, value)
  }

  void() {
    return this.unit(Void)
  }

  tuple(vals: Val[]): Val<T.Tuple> {
    return this.target.tupleJoin(this, vals)
  }

  unpack(val: Val<T.Tuple>): Val[] {
    return this.target.tupleSplit(this, val)
  }

  array(vals: Val[]): Val<T.ArrayFixed | T.ArrayEmpty> {
    if (vals.length == 0) {
      return this.unit(ArrayEmpty)
    }

    const ty = vals[0]!.ty
    if (!vals.every((x) => x.ty.eq(ty, null))) {
      this.issue(`All elements passed to 'Ctx.array' must be of the same type.`)
    }

    return this.target.arrayCons(this, [vals.length], ty, vals)
  }
}
