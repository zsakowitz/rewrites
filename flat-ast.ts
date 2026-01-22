const enum T {
    Const,
    Add,
    Sub,
    Mul,
    Div,
    Neg,
}

type Ast =
    | { k: T.Const; v: number }
    | { k: T.Add; v: { l: Ast; r: Ast } }
    | { k: T.Sub; v: { l: Ast; r: Ast } }
    | { k: T.Mul; v: { l: Ast; r: Ast } }
    | { k: T.Div; v: { l: Ast; r: Ast } }
    | { k: T.Neg; v: Ast }

function execAst(a: Ast): number {
    switch (a.k) {
        case T.Const:
            return a.v
        case T.Add:
            return execAst(a.v.l) + execAst(a.v.r)
        case T.Sub:
            return execAst(a.v.l) - execAst(a.v.r)
        case T.Mul:
            return execAst(a.v.l) * execAst(a.v.r)
        case T.Div:
            return execAst(a.v.l) / execAst(a.v.r)
        case T.Neg:
            return -execAst(a.v)
    }
}

function compAst(a: Ast) {}

type Flat =
    | { k: T.Const; v: number }
    | { k: T.Add; v: { l: number; r: number } }
    | { k: T.Sub; v: { l: number; r: number } }
    | { k: T.Mul; v: { l: number; r: number } }
    | { k: T.Div; v: { l: number; r: number } }
    | { k: T.Neg; v: number }

function execFlat(codes: Flat[], idx: number): number {
    const a = codes[idx]!
    switch (a.k) {
        case T.Const:
            return a.v
        case T.Add:
            return execFlat(codes, a.v.l) + execFlat(codes, a.v.r)
        case T.Sub:
            return execFlat(codes, a.v.l) - execFlat(codes, a.v.r)
        case T.Mul:
            return execFlat(codes, a.v.l) * execFlat(codes, a.v.r)
        case T.Div:
            return execFlat(codes, a.v.l) / execFlat(codes, a.v.r)
        case T.Neg:
            return -execFlat(codes, a.v)
    }
}

function execFlatAsStack(codes: Flat[]): number {
    const stack: number[] = []
    for (let i = 0; i < codes.length; i++) {
        const { k, v } = codes[i]!
        switch (k) {
            case T.Const:
                stack.push(v)
                break
            case T.Add:
                stack.push(stack.pop()! + stack.pop()!)
                break
            case T.Sub:
                stack.push(stack.pop()! - stack.pop()!)
                break
            case T.Mul:
                stack.push(stack.pop()! * stack.pop()!)
                break
            case T.Div:
                stack.push(stack.pop()! / stack.pop()!)
                break
            case T.Neg:
                stack.push(-stack.pop()!)
                break
        }
    }
    return stack[0]!
}

function astToFlat({ k, v }: Ast, codes: Flat[]): number {
    switch (k) {
        case T.Const:
            codes.push({ k: T.Const, v })
            return codes.length - 1
        case T.Add:
        case T.Sub:
        case T.Mul:
        case T.Div:
            codes.push({
                k,
                v: { l: astToFlat(v.l, codes), r: astToFlat(v.r, codes) },
            })
            return codes.length - 1
        case T.Neg:
            codes.push({ k, v: astToFlat(v, codes) })
            return codes.length - 1
    }
}

function random(depth: number): Ast {
    if (Math.random() < 0.98 ** depth) {
        if (Math.random() < 0.2) {
            return {
                k: T.Neg,
                v: random(depth + 1),
            }
        }

        return {
            k: Math.floor(Math.random() * 4) + 1,
            v: { l: random(depth + 1), r: random(depth + 1) },
        }
    }

    return {
        k: T.Const,
        v: Math.random(),
    }
}

function test() {
    const ast = random(0)
    const codes: Flat[] = []
    const flat = astToFlat(ast, codes)
    console.log(codes.length)

    {
        console.time()
        let r = []
        for (let i = 0; i < 1e2; i++) r.push(execAst(ast))
        console.timeEnd()
    }

    {
        console.time()
        let r = []
        for (let i = 0; i < 1e2; i++) r.push(execFlat(codes, flat))
        console.timeEnd()
    }

    {
        console.time()
        let r = []
        for (let i = 0; i < 1e2; i++) r.push(execFlatAsStack(codes))
        console.timeEnd()
    }
}

test()
