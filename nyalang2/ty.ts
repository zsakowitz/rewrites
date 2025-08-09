import type { Adt } from "./adt"
import type { Const } from "./const"
import type { Fn } from "./fn"
import type { IdGlobal } from "./id"

// prettier-ignore
export const enum T {
  Never, Bool, Int, Num, // very core primitive types
  Sym,                   // symbols like ruby, as in :hello, :plot_2d, and :circle (ints at runtime)
  Array, ArrayCapped,    // ndarrays; arraycapped has a max length and stores its length separately
  ArrayUnsized,          // unsized arrays; behave like js arrays and rust `Vec`
  Tuple,                 // on-the-fly collections
  Adt,                   // for extra user-defined types
  Fn,                    // closures and function references; a single type only includes one
}

export interface TyData {
  [T.Never]: null
  [T.Bool]: null
  [T.Int]: null
  [T.Num]: null
  [T.Sym]: { tag: IdGlobal | null; el: Ty } // :hello == :hello(())
  [T.Array]: { el: Ty; size: number[] }
  [T.ArrayCapped]: { el: Ty; size: number[] }
  [T.ArrayUnsized]: { el: Ty; size: null }
  [T.Tuple]: Ty[]
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
      case T.Array:
      case T.ArrayCapped: {
        const o = this.of as TyData[T.Array | T.ArrayCapped]
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
}
