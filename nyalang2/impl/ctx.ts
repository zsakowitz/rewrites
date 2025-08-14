import type { Block } from "./block"
import { Const } from "./const"
import { issue } from "./error"
import { ident, type IdGlobal } from "./id"
import { type Param } from "./param"
import type { Pos } from "./pos"
import { ArrayEmpty2, Int, Null, Ty, Void, type T } from "./ty"
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

  get coerce() {
    return this.block.scope.root.coerce
  }

  join(text: TemplateStringsArray, ...args: (Val | string)[]): ValString {
    let ret = text[0]!
    for (let i = 1; i < text.length; i++) {
      const val = args[i - 1]!
      if (typeof val == "string") {
        ret += val
      } else {
        ret += `(`
        ret += this.target.x(this, val)
        ret += `)`
      }
      ret += text[i]!
    }
    return new ValString(ret)
  }

  runtime(val: Val): string | null {
    return this.target.x(this, val)
  }

  asRuntime(val: Val): Val {
    return new Val(this.runtime(val), val.ty, false)
  }

  // doesn't yet handle broadcasting and lists
  tryCallTy(name: IdGlobal | Param, args: Ty[]): Ty | null {
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
        if (!fn.where[i]!.matches(params)) {
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
        if (!fn.where[i]!.matches(params)) {
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

  callTy(name: IdGlobal | Param, args: Ty[]): Ty {
    return (
      this.tryCallTy(name, args)
      ?? this.issue(`'${name.label}' is not defined.`)
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

  arrayTy(vals: Ty[]): Ty<T.ArrayFixed> {
    if (vals.length == 0) {
      return ArrayEmpty2
    }

    const ty = this.root.coerce.unifyAll(
      this,
      vals[0]!,
      vals.slice(1),
      null,
      (a, b) => `Mismatched types '${a}' and '${b}' when constructing array.`,
    )

    return Ty.Array(ty, new Const(vals.length, Int))
  }

  array(vals: Val[]): Val<T.ArrayFixed> {
    if (vals.length == 0) {
      return this.unit(ArrayEmpty2)
    }

    const ty = this.root.coerce.unifyAll(
      this,
      vals[0]!.ty,
      vals.slice(1).map((x) => x.ty),
      null,
      (a, b) => `Mismatched types '${a}' and '${b}' when constructing array.`,
    )

    return this.target.arrayCons(
      this,
      [vals.length],
      ty,
      vals.map((x) => x.coerce(this, ty, null)),
    )
  }

  null() {
    return this.unit(Null)
  }

  some(val: Val): Val<T.Option> {
    return this.target.optFromVal(this, val)
  }

  indexTupleTy(ty: Ty<T.Tuple>, idx: number) {
    if (!(0 <= idx && idx <= ty.of.length && idx == Math.floor(idx))) {
      this.issue(`Index '${idx}' is out of bounds for tuple of type '${ty}'.`)
    }
    return ty.of[idx]!
  }

  indexTuple(val: Val<T.Tuple>, idx: number) {
    if (!(0 <= idx && idx <= val.ty.of.length && idx == Math.floor(idx))) {
      this.issue(
        `Index '${idx}' is out of bounds for tuple of type '${val.ty}'.`,
      )
    }
    return this.target.tupleIndex(this, val, idx)
  }

  at(pos: Pos) {
    return new Ctx(this.block, pos)
  }
}
