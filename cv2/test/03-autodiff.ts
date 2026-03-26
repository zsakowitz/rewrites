enum K {
    Const,
    Var,

    // Basic arithmetic
    Add,
    Mul,
    // Div,
    // Sin,
    // Floor,

    // Boolean ops
    Piecewise,
    // Le,
    Eq,
    // Ne,
    // Or,
}

type Inst =
    | { k: K.Const; v: number }
    | { k: K.Var; v: string }
    | { k: Exclude<K, K.Const | K.Var>; v: number[] }

function print(x: Inst[]) {
    console.log(
        x
            .map(
                (x, i) =>
                    `${("" + i).padStart(2, "0")} ${K[x.k]} ${
                        typeof x.v == "object" ?
                            x.v.map((x) => ("" + x).padStart(2, "0")).join(" ")
                        :   x.v
                    }\n`,
            )
            .join("")
            + "===> "
            + write(x, x.length - 1)
            + "\n",
    )
}

function autodiff(a: Inst[], wrt: string) {
    const zval: number[] = []
    const dval: number[] = []
    const body: Inst[] = [
        { k: K.Const, v: 0 },
        { k: K.Const, v: 1 },
        { k: K.Const, v: NaN },
    ]

    for (const { k, v } of a) {
        switch (k) {
            case K.Const:
                body.push({ k, v })
                zval.push(body.length - 1)
                dval.push(0)
                break

            case K.Var:
                body.push({ k, v })
                zval.push(body.length - 1)
                dval.push(wrt == v ? 1 : 0)
                break

            case K.Add:
                body.push({ k: K.Add, v: [zval[v[0]!]!, zval[v[1]!]!] })
                body.push({ k: K.Add, v: [dval[v[0]!]!, dval[v[1]!]!] })
                zval.push(body.length - 2)
                dval.push(body.length - 2)
                break

            case K.Mul:
                body.push({ k: K.Mul, v: [zval[v[0]!]!, zval[v[1]!]!] })
                body.push({ k: K.Mul, v: [zval[v[0]!]!, dval[v[1]!]!] })
                body.push({ k: K.Mul, v: [dval[v[1]!]!, zval[v[0]!]!] })
                body.push({ k: K.Add, v: [body.length - 2, body.length - 1] })
                zval.push(body.length - 4)
                dval.push(body.length - 1)
                break

            case K.Piecewise:
                body.push({
                    k: K.Piecewise,
                    v: [zval[v[0]!]!, zval[v[1]!]!, zval[v[2]!]!],
                })
                body.push({
                    k: K.Piecewise,
                    v: [zval[v[0]!]!, dval[v[1]!]!, dval[v[2]!]!],
                })
                zval.push(body.length - 2)
                dval.push(body.length - 1)
                break

            case K.Eq:
        }
    }

    return body
}

const example: Inst[] = [
    { k: K.Var, v: "x" },
    { k: K.Mul, v: [0, 0] },
]

function write(a: Inst[], i: number): string {
    const { k, v } = a[i]!

    switch (k) {
        case K.Const:
            return v + ""

        case K.Var:
            return v

        case K.Add:
            return `(${write(a, v[0]!)}+${write(a, v[1]!)})`

        case K.Mul:
            return `(${write(a, v[0]!)}*${write(a, v[1]!)})`

        case K.Piecewise:
            return `(${write(a, v[0]!)}?${write(a, v[1]!)}:${write(a, v[2]!)})`

        case K.Eq:
            return `(${write(a, v[0]!)}==${write(a, v[1]!)})`
    }
}

print(example)
print(autodiff(example, "x"))
