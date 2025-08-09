import { Adt, AdtSym } from "./adt"
import { ident } from "./id"
import { IdMap } from "./map"
import { Pos } from "./pos"
import { ScopeRoot } from "./scope"
import { T, Ty } from "./ty"
import { Val } from "./val"

const { Int, Num, Bool, Void } = Ty

const pos = Pos.native()
const root = new ScopeRoot()

root.coerce.add(pos, Int, Num, (_, v) => new Val(`${v}`, Num, false))
root.coerce.add(pos, Bool, Int, (_, v) => new Val(`+${v}`, Bool, false))

const HelloWorld: Adt = new Adt(
  ident("HelloWorld"),
  new IdMap<AdtSym>()
    .set(
      ident("hello"),
      new AdtSym(
        ident("hello"),
        Ty.Void,
        () => new Val('"hello"', HelloWorldTy, false),
      ),
    )
    .set(
      ident("world"),
      new AdtSym(
        ident("world"),
        Ty.Void,
        () => new Val('"world"', HelloWorldTy, false),
      ),
    ),
  null,
  pos,
)
const HelloWorldTy = new Ty(T.Adt, { adt: HelloWorld, tys: [], consts: [] })
