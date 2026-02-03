export type Leaf =
    | { type: "x" }
    | { type: "fn"; name: string; ticks: number; body: Expr }

export type Prod = { type: "prod"; const: number; items: Leaf[] }

export type Expr = { type: "sum"; items: Prod[] }

const INITIAL: Expr = {
    type: "sum",
    items: [
        {
            type: "prod",
            const: 1,
            items: [
                {
                    type: "fn",
                    name: "f",
                    ticks: 0,
                    body: {
                        type: "sum",
                        items: [
                            {
                                type: "prod",
                                const: 1,
                                items: [
                                    {
                                        type: "fn",
                                        name: "g",
                                        ticks: 0,
                                        body: {
                                            type: "sum",
                                            items: [
                                                {
                                                    type: "prod",
                                                    const: 1,
                                                    items: [
                                                        {
                                                            type: "x",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        },
    ],
}

const ZERO: Expr = {
    type: "sum",
    items: [
        {
            type: "prod",
            const: 0,
            items: [],
        },
    ],
}

export function multiply(sums: Expr[]): Expr {
    if (sums.length == 0) {
        return { type: "sum", items: [] }
    }

    return sums.reduce(
        (a, b): Expr => ({
            type: "sum",
            items: a.items
                .flatMap<Prod>((a): Prod[] =>
                    b.items.map(
                        (b): Prod => ({
                            type: "prod",
                            const: a.const * b.const,
                            items: [...a.items, ...b.items],
                        }),
                    ),
                )
                .filter((x) => x.const != 0),
        }),
    )
}

export function derivLeaf(leaf: Leaf): Expr {
    switch (leaf.type) {
        case "x":
            return {
                type: "sum",
                items: [{ type: "prod", const: 1, items: [] }],
            }
        case "fn":
            return multiply([
                derivExpr(leaf.body),
                exprOf({ ...leaf, ticks: leaf.ticks + 1 }),
            ])
    }
}

export function exprOf(leaf: Leaf): Expr {
    return { type: "sum", items: [{ type: "prod", const: 1, items: [leaf] }] }
}

export function derivProdOne(a: Expr, b: Leaf): Expr {
    return {
        type: "sum",
        items: [
            ...multiply([derivExpr(a), exprOf(b)]).items,
            ...multiply([derivLeaf(b), a]).items,
        ],
    }
}

export function derivProd(prod: Prod): Expr {
    if (prod.items.length == 0) {
        return ZERO
    } else if (prod.items.length == 1) {
        return derivLeaf(prod.items[0]!)
    } else if (prod.items.length == 2) {
        return derivProdOne(exprOf(prod.items[0]!), prod.items[1]!)
    }

    return prod.items
        .slice(1)
        .reduce<Expr>((a, b) => derivProdOne(a, b), exprOf(prod.items[0]!))
}

export function derivExpr(sum: Expr): Expr {
    return { type: "sum", items: sum.items.flatMap((x) => derivProd(x).items) }
}

export function isJustX(expr: Expr) {
    return (
        expr.items.length == 1
        && expr.items[0]!.const == 1
        && expr.items[0]!.items.length == 1
        && expr.items[0]!.items[0]!.type == "x"
    )
}

export function strLeaf(expr: Leaf): string {
    switch (expr.type) {
        case "x":
            return "x"
        case "fn":
            return (
                expr.name
                + "'".repeat(expr.ticks)
                + (isJustX(expr.body) ? "" : "(" + strInner(expr.body) + ")")
            )
    }
}

export function strProd(expr: Prod): string {
    if (expr.const == 0) {
        return "0"
    } else if (expr.const == 1) {
        if (expr.items.length) {
            return expr.items.map(strLeaf).join(" ")
        } else {
            return "1"
        }
    } else {
        if (expr.items.length) {
            return expr.const + " " + expr.items.map(strLeaf).join(" ")
        } else {
            return expr.const.toString()
        }
    }
}

export function strInner(expr: Expr): string {
    return expr.items.map(strProd).join(" + ") || "0"
}

export function str(expr: Expr) {
    return "\n  " + expr.items.map(strProd).join("\n+ ")
}

export function sort(a: Leaf, b: Leaf) {
    return (
        a.type == "x" ? -1
        : b.type == "x" ? 1
        : a.name < b.name ? -1
        : b.name < a.name ? 1
        : a.ticks < b.ticks ? -1
        : b.ticks < a.ticks ? 1
        : 0
    )
}

export function sortLeaf(leaf: Leaf): Leaf {
    switch (leaf.type) {
        case "x":
            return leaf
        case "fn":
            return { ...leaf, body: sortExpr(leaf.body) }
    }
}

export function sortProd(prod: Prod): Prod {
    return {
        type: "prod",
        const: prod.const,
        items: prod.items.map(sortLeaf).sort(sort),
    }
}

export function sortProdInSum(a: Prod, b: Prod) {
    return (
        a.items.length == 0 ? -1
        : b.items.length == 0 ? 1
        : sort(a.items[0]!, b.items[0]!) || a.const - b.const
    )
}

export function sortExpr(prod: Expr): Expr {
    return { type: "sum", items: prod.items.map(sortProd).sort(sortProdInSum) }
}

export function deriv(expr: Expr): Expr {
    return sortExpr(derivExpr(expr))
}

console.log(str(INITIAL))
console.log(str(deriv(INITIAL)))
console.log(str(deriv(deriv(INITIAL))))
console.log(str(deriv(deriv(deriv(INITIAL)))))
