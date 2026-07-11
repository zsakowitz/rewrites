// V-prefixed types refer to already-evaluated types, values, ADTs, and items.

export type VType =
    | { k: "never"; v: null }
    | { k: "void"; v: null }
    | { k: "bool"; v: null }
    | { k: "int"; v: null }
    | { k: "num"; v: null }
    | { k: "str"; v: null }
    | { k: "null"; v: null }
    | { k: "maybe"; v: VType }
    | { k: "list"; v: VType }
    | { k: "dot-prop"; v: null }
    | { k: "dot-record"; v: null }
    | { k: "closure"; v: { args: VType[]; ret: VType } }
    | { k: "adt"; v: VAdt } // instance of an ADT
    | { k: "type"; v: VType }

export type VAdt = {
    kind: "struct" | "enum" | "builtin"
    fields: { name: string; value: VType }[]
    items: { name: string; item: VItem }[]
}

export type VItem =
    | { k: "const"; v: { type: VType; value: VValue } }
    | { k: "adt"; v: VAdt }
    | { k: "func"; v: { args: VType[]; ret: VType; body: (args: VValue[]) => VValue } }

export type VUntypedValue =
    | { k: "void"; v: null }
    | { k: "bool"; v: boolean }
    | { k: "int"; v: bigint }
    | { k: "num"; v: number }
    | { k: "str"; v: string }
    | { k: "null"; v: null }
    | { k: "maybe-none"; v: null }
    | { k: "maybe-some"; v: VUntypedValue }
    | { k: "list"; v: VUntypedValue[] }
    | { k: "dot-prop"; v: { name: string; args: VValue[] | null } }
    | { k: "dot-record"; v: { k: string; v: VValue }[] }
    | { k: "closure"; v: (args: VValue[]) => VValue }
    | { k: "inst-struct"; v: { k: string; v: VUntypedValue }[] }
    | { k: "inst-enum"; v: { k: string; v: VUntypedValue } }
    | { k: "type"; v: null }

export type VValue = { k: VType; v: VUntypedValue }

export type TExpr =
    | { k: "void"; v: null }
    | { k: "bool"; v: boolean }
    | { k: "int"; v: bigint }
    | { k: "num"; v: number }
    | { k: "str"; v: string }
    | { k: "null"; v: null }
    | { k: "maybe-some"; v: TExpr }
    | { k: "list"; v: TExpr[] }
    | { k: "dot-lit"; v: { name: string; args: TExpr[] | null } }
    | { k: "dot-record"; v: { k: string; v: TExpr }[] }
    | { k: "closure"; v: (args: VValue[]) => VValue }
    | { k: "inst-struct"; v: { k: string; v: VUntypedValue }[] }
    | { k: "inst-enum"; v: { k: string; v: VUntypedValue } }
    | { k: "adt-ns"; v: null }
