import * as ANSI from "../ansi"
import type { Adt } from "./adt"
import { Var } from "./coercion"
import type { Const } from "./const"
import type { Fn } from "./fn"
import type { IdGlobal } from "./id"
import { INSPECT } from "./inspect"
import { Param, ParamKind, type FnParams } from "./param"

// prettier-ignore
// no uint b/c js doesn't support it and glsl only uses `int`
export const enum T {
  Never, Bool, Int, Num, // very core primitive types
  Null,                  // the `null` of an optional
  ArrayEmpty,            // empty array; exists for desmos compat and other reasons
  Sym,                   // ruby symbols like :hello, with optional data attached
  Tuple,                 // on-the-fly collections
  ArrayFixed,            // ndarray with fixed shape
  ArrayCapped,           // single-dimension array with variable, but capped, length
  ArrayUnsized,          // unsized arrays; behave like js arrays and rust `Vec`
  Adt,                   // for extra user-defined types
  Fn,                    // concrete closure or function reference
  Param,                 // generic parameter
  Option,                // optional (`x` and `null` both coerce to `Option<typeof x>`)
}

// note: an array `arr` of type `[num; 2, 3]` must be indexed as `arr[1, 0]`

export declare namespace T {
  type Const = T.Bool | T.Int
  type ArrayAny = T.ArrayFixed | T.ArrayCapped | T.ArrayUnsized
}

export interface TyData {
  [T.Never]: null
  [T.Bool]: null
  [T.Int]: null
  [T.Num]: null
  [T.Sym]: { tag: IdGlobal | null; el: Ty } // :hello == :hello(())
  [T.Tuple]: Ty[]
  [T.ArrayEmpty]: null
  [T.ArrayFixed]: { el: Ty; size: Const<T.Int>[] }
  [T.ArrayCapped]: { el: Ty; size: Const<T.Int> }
  [T.ArrayUnsized]: { el: Ty; size: null }
  [T.Adt]: { adt: Adt; tys: Ty[]; consts: Const[] }
  [T.Fn]: Fn
  [T.Param]: Param<ParamKind.Ty>
  [T.Option]: Ty
  [T.Null]: null
}

export class Ty<out K extends T = T> {
  static Sym(tag: IdGlobal): Ty<T.Sym> {
    return new Ty(T.Sym, { tag, el: Void })
  }

  static Param(label: string): Ty<T.Param> {
    return new Ty(T.Param, new Param(label, ParamKind.Ty))
  }

  static Array(el: Ty, size: Const<T.Int>): Ty<T.ArrayFixed> {
    if (el.is(T.ArrayFixed)) {
      return new Ty(T.ArrayFixed, { el: el.of.el, size: [size, ...el.of.size] })
    } else {
      return new Ty(T.ArrayFixed, { el, size: [size] })
    }
  }

  constructor(
    readonly k: K,
    readonly of: TyData[K],
  ) {
    if (k == T.ArrayFixed) {
      const { el, size } = of as TyData[T.ArrayFixed]
      if (el.is(T.ArrayFixed)) {
        const data = {
          el: el.of.el,
          size: [...size, ...el.of.size],
        }
        return new Ty(T.ArrayFixed, data) as any
      }
    }

    if (typeof k != "number") {
      throw new Error("nope")
    }

    this.has0 = this.#has0()
    this.has1 = this.#has1()
    this.const = this.#const()
  }

  is<L extends K>(k: L): this is Ty<L> {
    return this.k == (k as any as K)
  }

  eq(other: Ty, params: FnParams | null): boolean {
    if (this.k != other.k) {
      return false
    }

    if (params && other.is(T.Param) && params?.has(other.of)) {
      return params.setTy(other.of, this, Var.Invar)
    }

    switch (this.k as T) {
      case T.Never:
      case T.Bool:
      case T.Int:
      case T.Num:
      case T.ArrayEmpty:
      case T.Null:
        return true
      case T.Sym: {
        const src = this.of as TyData[T.Sym]
        const dst = other.of as TyData[T.Sym]
        return src.tag == dst.tag && src.el.eq(dst.el, params)
      }
      case T.Tuple: {
        const src = this.of as TyData[T.Tuple]
        const dst = other.of as TyData[T.Tuple]
        return (
          src.length == dst.length && src.every((x, i) => x.eq(dst[i]!, params))
        )
      }
      case T.ArrayFixed: {
        const src = this.of as TyData[T.ArrayFixed]
        const dst = other.of as TyData[T.ArrayFixed]
        return (
          src.el.eq(dst.el, params)
          && src.size.length == dst.size.length
          && src.size.every((x, i) => x.eqTo(dst.size[i]!, params))
        )
      }
      case T.ArrayCapped: {
        const src = this.of as TyData[T.ArrayCapped]
        const dst = other.of as TyData[T.ArrayCapped]
        return src.el.eq(dst.el, params) && src.size.eqTo(dst.size, params)
      }
      case T.ArrayUnsized: {
        const src = this.of as TyData[T.ArrayUnsized]
        const dst = other.of as TyData[T.ArrayUnsized]
        return src.el.eq(dst.el, params)
      }
      case T.Adt: {
        const src = this.of as TyData[T.Adt]
        const dst = other.of as TyData[T.Adt]
        return (
          src.adt == dst.adt
          && src.tys.every((x, i) => x.eq(dst.tys[i]!, params))
          && src.consts.every((x, i) => x.eqTo(dst.consts[i]!, params))
        )
      }
      case T.Fn: {
        const src = this.of as TyData[T.Fn]
        const dst = other.of as TyData[T.Fn]
        return src == dst
      }
      case T.Param: {
        const src = this.of as TyData[T.Param]
        const dst = other.of as TyData[T.Param]
        return src == dst
      }
      case T.Option: {
        const src = this.of as TyData[T.Option]
        const dst = other.of as TyData[T.Option]
        return src.eq(dst, params)
      }
    }
  }

  with(this: Ty, params: FnParams): Ty {
    if (this.const) {
      return this
    }

    if (params && this.is(T.Param) && params.has(this.of)) {
      return params.get(this.of)
    }

    switch (this.k as T) {
      case T.Never:
      case T.Bool:
      case T.Int:
      case T.Num:
      case T.Fn:
      case T.ArrayEmpty:
      case T.Param:
      case T.Null:
        return this
      case T.Sym: {
        const src = this.of as TyData[T.Sym]
        return new Ty(T.Sym, { tag: src.tag, el: src.el.with(params) })
      }
      case T.Tuple: {
        const src = this.of as TyData[T.Tuple]
        if (this == Void) {
          return Void
        }
        return new Ty(
          T.Tuple,
          src.map((x) => x.with(params)),
        )
      }
      case T.ArrayFixed: {
        const src = this.of as TyData[T.ArrayFixed]
        return new Ty(T.ArrayFixed, {
          el: src.el.with(params),
          size: src.size.map((x) => x.with(params)),
        })
      }
      case T.ArrayCapped: {
        const src = this.of as TyData[T.ArrayCapped]
        return new Ty(T.ArrayCapped, {
          el: src.el.with(params),
          size: src.size.with(params),
        })
      }
      case T.ArrayUnsized: {
        const src = this.of as TyData[T.ArrayUnsized]
        return new Ty(T.ArrayUnsized, { el: src.el.with(params), size: null })
      }
      case T.Adt: {
        const src = this.of as TyData[T.Adt]
        return new Ty(T.Adt, {
          adt: src.adt,
          tys: src.tys.map((x) => x.with(params)),
          consts: src.consts.map((x) => x.with(params)),
        })
      }
      case T.Option: {
        const src = this.of as TyData[T.Option]
        return new Ty(T.Option, src.with(params))
      }
    }
  }

  #const(this: Ty): boolean {
    switch (this.k as T) {
      case T.Never:
      case T.Bool:
      case T.Int:
      case T.Num:
      case T.Fn:
      case T.ArrayEmpty:
      case T.Null:
        return true
      case T.Param:
        return false
      case T.Sym: {
        const src = this.of as TyData[T.Sym]
        return src.el.const
      }
      case T.Tuple: {
        const src = this.of as TyData[T.Tuple]
        return src.every((x) => x.const)
      }
      case T.ArrayFixed: {
        const src = this.of as TyData[T.ArrayFixed]
        return src.size.every((x) => x.const) && src.el.const
      }
      case T.ArrayCapped: {
        const src = this.of as TyData[T.ArrayCapped]
        return src.size.const && src.el.const
      }
      case T.ArrayUnsized: {
        const src = this.of as TyData[T.ArrayUnsized]
        return src.el.const
      }
      case T.Adt: {
        const src = this.of as TyData[T.Adt]
        return src.tys.every((x) => x.const) && src.consts.every((x) => x.const)
      }
      case T.Option: {
        const src = this.of as TyData[T.Option]
        return src.const
      }
    }
  }

  #has0(): boolean {
    switch (this.k) {
      case T.Never:
        return true
      case T.Bool:
      case T.Int:
      case T.Num:
      case T.Fn:
      case T.ArrayEmpty:
      case T.Null:
      case T.Option: // `null` is always available
        return false
      case T.Sym:
        return (this.of as TyData[T.Sym]).el.has0
      case T.Tuple:
        return (this.of as TyData[T.Tuple]).some((x) => x.has0)
      case T.ArrayFixed: {
        const self = this.of as TyData[T.ArrayFixed]
        return self.el.has0 && self.size.every((x) => !x.is0())
        // only nonempty arrays with uninhabited elements are uninhabited;
        // an empty array can have any kind of element it wants
      }
      case T.ArrayCapped:
      case T.ArrayUnsized:
        // if length 0, it has 1 possible value
        // and an unsized array could always possibly have length 0
        return false
      case T.Adt:
        // have to defer to T.Adt on this one
        return (this.of as TyData[T.Adt]).adt.has0(this as Ty<T.Adt>)
      case T.Param:
        return false // technically this should be 'maybe', but that seems bad
    }
  }

  #has1(): boolean {
    switch (this.k) {
      case T.Never: // never is uninhabited, which is not the same as having a single member
      case T.Bool:
      case T.Int:
      case T.Num:
        return false
      case T.ArrayEmpty:
      case T.Fn:
      case T.Null:
        return true
      case T.Sym: {
        const self = this.of as TyData[T.Sym]
        return self.tag != null && self.el.has1
      }
      case T.Tuple:
        return (this.of as TyData[T.Tuple]).every((x) => x.has1)
      case T.ArrayFixed: {
        const self = this.of as TyData[T.ArrayFixed]
        return self.el.has1 || self.size.some((x) => x.is0())
      }
      case T.ArrayCapped: {
        const self = this.of as TyData[T.ArrayCapped]
        return (
          self.el.has0 // in this case, only length 0 is a valid value
          || self.size.is0() // must have length 0, so only one value
        )
      }
      case T.ArrayUnsized:
        return (this.of as TyData[T.ArrayUnsized]).el.has0 // only [] is valid
      case T.Adt:
        return (this.of as TyData[T.Adt]).adt.has1(this as Ty<T.Adt>)
      case T.Option:
        return (this.of as TyData[T.Option]).has0 // so only `null` is valid
      case T.Param:
        return false // technically this should be 'maybe', but that seems bad
    }
  }

  /**
   * `true` iff this type is uninhabited (i.e. no values can be constructed with
   * this type).
   *
   * Examples include `!`, empty enums, and anything including at least 1 of
   * those.
   */
  readonly has0!: boolean

  /**
   * `true` iff there only exists one possible value of this type.
   *
   * Examples include `()`, constant symbols, and anything including only other
   * `has1` types.
   *
   * `target.toRuntime(val)` must return `null` if and only if `val.ty.has1`.
   * This is required for languages like GLSL, where values of type `void`
   * cannot be constructed, and is a helpful optimization for other target
   * languages.
   */
  readonly has1!: boolean

  readonly const!: boolean

  toString(): string {
    switch (this.k) {
      case T.Never:
        return "!"
      case T.Bool:
        return "bool"
      case T.Int:
        return "int"
      case T.Num:
        return "num"
      case T.ArrayEmpty:
        return "[~empty~]"
      case T.Null:
        return "null"
      case T.Sym: {
        const o = this.of as TyData[T.Sym]
        const tag = o.tag ? ":" + o.tag.label : `sym`
        return tag + (o.el != Void ? `(${o.el})` : "")
      }
      case T.ArrayFixed: {
        const o = this.of as TyData[T.ArrayFixed]
        return `[${o.el}; ${o.size.join(", ")}]`
      }
      case T.ArrayCapped: {
        const o = this.of as TyData[T.ArrayCapped]
        return `[${o.el}; ..=${o.size}]`
      }
      case T.ArrayUnsized: {
        const o = this.of as TyData[T.ArrayUnsized]
        return `[${o.el}]`
      }
      case T.Tuple: {
        const o = this.of as TyData[T.Tuple]
        return `(${o.join(", ")}${o.length == 1 ? "," : ""})`
      }
      case T.Adt: {
        const o = this.of as TyData[T.Adt]
        const els = [...o.tys, ...o.consts].join(", ")
        return `${o.adt.label}${els ? `<${els}>` : ""}`
      }
      case T.Fn: {
        const o = this.of as TyData[T.Fn]
        return `fn(${o.args.join(", ")})${o.ret == Void ? "" : ` -> ${o.ret}`}`
      }
      case T.Param:
        return (this.of as TyData[T.Param]).label
      case T.Option:
        return `?${this.of as TyData[T.Option]}`
    }
  }

  [INSPECT]() {
    const C = ANSI.reset + ANSI.cyan
    const R = ANSI.reset
    return (
      C
      + this.toString().replace(
        /[():,;[\]?]/g,
        (x) => R + ("():".includes(x) ? ANSI.dim : "") + x + C,
      )
      + R
    )
  }
}

export const Never = new Ty(T.Never, null)
export const Bool = new Ty(T.Bool, null)
export const Int = new Ty(T.Int, null)
export const Num = new Ty(T.Num, null)
export const Null = new Ty(T.Null, null)
export const ArrayEmpty = new Ty(T.ArrayEmpty, null)
export const Void = new Ty(T.Tuple, [])
