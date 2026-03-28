const enum K {
    Const,

    LoadVar,
    CallNative,

    TupleNew,
    TupleGet,

    Select,
}

const enum F {
    NumPrint,
    NumAdd,
    NumMul,
}

const enum Type {
    Int,
    Num,
    Bool,
    Null,
}

const DiffZero: Record<Type, Inst> = [
    { k: K.Const, v: Type.Int, a: 0 },
    { k: K.Const, v: Type.Num, a: 0 },
    { k: K.Const, v: Type.Null, a: null },
    { k: K.Const, v: Type.Null, a: null },
]

const DiffUnit: Record<Type, Inst> = [
    { k: K.Const, v: Type.Int, a: 1 },
    { k: K.Const, v: Type.Num, a: 1 },
    { k: K.Const, v: Type.Null, a: null },
    { k: K.Const, v: Type.Null, a: null },
]

type Inst =
    | { k: K.Const; v: Type; a: unknown }
    | { k: K.LoadVar; v: Type; a: string }
    | { k: K.CallNative; v: F; a: number[] }
    | { k: K.TupleNew; v: Type; a: number[] }
    | { k: K.TupleGet; v: number; a: number }
    | {
          k: K.Select
          v: Type
          a: [condition: number, vTrue: number, vFalse: number]
      }

function diffNative(p: number[], d: number[], body: Inst[], k: F, a: number[]) {
    switch (k) {
        case F.NumPrint:
            break

        case F.NumAdd:
            break

        case F.NumMul:
            break

        default:
            k satisfies never
    }
}

function diff(source: Inst[], wrt: string): Inst[] {
    const p: number[] = [] // actual value
    const d: number[] = [] // derivative
    const body: Inst[] = []

    for (let i = 0; i < source.length; i++) {
        const { k, v, a } = source[i]!

        if (k == K.Const || k == K.LoadVar) {
            body.push({ k, v, a } as Inst)
            body.push(k == K.LoadVar && wrt == a ? DiffUnit[v] : DiffZero[v])
            p.push(body.length - 2)
            d.push(body.length - 1)
            break
        }

        a

        switch (k) {
            case K.Const:
                body.push({ k, v, a })
                body.push(DiffZero[v])
                p.push(body.length - 2)
                d.push(body.length - 1)
                break

            case K.LoadVar:
                body.push({ k, v, a })
                body.push(wrt == a ? DiffUnit[v] : DiffZero[v])
                p.push(body.length - 2)
                d.push(body.length - 1)
                break

            case K.CallNative: {
                const a2: number[] = []
                for (let i = 0; i < a.length; i++) {
                    a2.push(p[i]!)
                }
                body.push({ k, v, a: a2 })
                p.push(body.length - 1)
                diffNative(p, d, body, v, a)
                break
            }

            case K.TupleNew:
                {
                }
                break

            case K.TupleGet:
                break

            case K.Select:
                break

            default:
                k satisfies never
        }
    }

    return body
}
