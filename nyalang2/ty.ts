import type { Adt } from "./adt"
import { ANSI } from "./ansi"
import type { Const } from "./const"
import type { Fn } from "./fn"
import type { IdGlobal } from "./id"
import { INSPECT } from "./inspect"

// prettier-ignore
// no uint b/c js doesn't support it and glsl only uses `int`
export const enum T {
  Never, Bool, Int, Num, // very core primitive types
  Sym,                   // ruby symbols like :hello, with optional data attached
  Tuple,                 // on-the-fly collections
  ArrayFixed,            // ndarray with fixed shape
  ArrayCapped,           // ndarray with fixed shape, but variable length for last dimension
  ArrayUnsized,          // unsized arrays; behave like js arrays and rust `Vec`
  Adt,                   // for extra user-defined types
  Fn,                    // closures and function references; a single type only includes one
}

export declare namespace T {
  type ArrayAny = T.ArrayFixed | T.ArrayCapped | T.ArrayUnsized
}

export interface TyData {
  [T.Never]: null
  [T.Bool]: null
  [T.Int]: null
  [T.Num]: null
  [T.Sym]: { tag: IdGlobal | null; el: Ty } // :hello == :hello(())
  [T.Tuple]: Ty[]
  [T.ArrayFixed]: { el: Ty; size: number[] }
  [T.ArrayCapped]: { el: Ty; size: number[] }
  [T.ArrayUnsized]: { el: Ty; size: null }
  [T.Adt]: { adt: Adt; tys: Ty[]; consts: Const[] }
  [T.Fn]: Fn
}

export class Ty<K extends T = T> {
  static Never = new Ty(T.Never, null)
  static Bool = new Ty(T.Bool, null)
  static Int = new Ty(T.Int, null)
  static Num = new Ty(T.Num, null)
  static Void = new Ty(T.Tuple, [])

  constructor(
    readonly k: K,
    readonly of: TyData[K],
  ) {}

  is<L extends K>(k: L): this is Ty<L> {
    return this.k == k
  }

  #has0(): boolean {
    switch (this.k) {
      case T.Never:
        return true
      case T.Bool:
      case T.Int:
      case T.Num:
      case T.Fn:
        return false
      case T.Sym:
        return (this.of as TyData[T.Sym]).el.has0
      case T.Tuple:
        return (this.of as TyData[T.Tuple]).some((x) => x.has0)
      case T.ArrayFixed: {
        const self = this.of as TyData[T.ArrayFixed]
        return self.el.has0 && self.size.every((x) => x != 0)
        // only nonempty arrays with uninhabited elements are uninhabited;
        // an empty array can have any kind of element it wants
      }
      case T.ArrayCapped:
      case T.ArrayUnsized:
        // if length 0, it has 1 possible values
        // and an unsized array could always possibly have length 0
        return false
      case T.Adt:
        // have to defer to T.Adt on this one
        return (this.of as TyData[T.Adt]).adt.has0(this as Ty<T.Adt>)
    }
  }

  #has1(): boolean {
    switch (this.k) {
      case T.Never: // never is uninhabited, which is not the same as having a single member
      case T.Bool:
      case T.Int:
      case T.Num:
        return false
      case T.Fn:
        return true
      case T.Sym: {
        const self = this.of as TyData[T.Sym]
        return self.tag != null && self.el.has1
      }
      case T.Tuple:
        return (this.of as TyData[T.Tuple]).every((x) => x.has1)
      case T.ArrayFixed: {
        const self = this.of as TyData[T.ArrayFixed]
        return self.el.has1 || self.size.some((x) => x == 0)
      }
      case T.ArrayCapped: {
        const self = this.of as TyData[T.ArrayCapped]
        return (
          self.el.has0 || // in this case, only length 0 is a valid value
          self.size.some((x) => x == 0) // no length, so only one value
        )
      }
      case T.ArrayUnsized:
        return (this.of as TyData[T.ArrayUnsized]).el.has0 // only [] is valid
      case T.Adt:
        return (this.of as TyData[T.Adt]).adt.has1(this as Ty<T.Adt>)
    }
  }

  /**
   * `true` iff this type is uninhabited (i.e. no values can be constructed with
   * this type).
   *
   * Examples include `!`, empty enums, and anything including at least 1 of
   * those.
   */
  readonly has0 = this.#has0()

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
  readonly has1 = this.#has1()

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
      case T.Sym: {
        const o = this.of as TyData[T.Sym]
        return (o.tag ? `:${o.tag.label}` : `sym`) + (o.el ? `(${o.el})` : "")
      }
      case T.ArrayFixed:
      case T.ArrayCapped: {
        const o = this.of as TyData[T.ArrayFixed | T.ArrayCapped]
        return `${this.k == T.ArrayCapped ? "~" : ""}[${o.el}; ${o.size.join(", ")}]`
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
        return `fn(${o.args.join(", ")})${o.ret == Ty.Void ? "" : ` -> ${o.ret}`}`
      }
    }
  }

  [INSPECT]() {
    const C = ANSI.cyan
    const R = ANSI.reset
    return C + this.toString().replace(/[,()]/g, (x) => R + x + C) + R
  }
}
