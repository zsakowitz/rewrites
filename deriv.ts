export type Expr = Readonly<
  | { type: "x" }
  | { type: "const"; n: number }
  | { type: "call"; name: string; ticks: number; body: Expr }
  | { type: "prod"; a: Expr; b: Expr }
  | { type: "sum"; a: Expr; b: Expr }
>

export type ExprNoSum = Readonly<
  | { type: "x" }
  | { type: "const"; n: number }
  | { type: "call"; name: string; ticks: number; body: Expr }
  | { type: "prod"; a: ExprNoSum; b: ExprNoSum }
>

export type ExprLeaf = Exclude<Expr, { type: "sum" | "prod" }>

const INITIAL: Expr = {
  type: "call",
  name: "f",
  ticks: 0,
  body: {
    type: "call",
    name: "g",
    ticks: 0,
    body: { type: "x" },
  },
}

export function derivRaw(expr: Expr): Expr {
  switch (expr.type) {
    case "x":
      return { type: "const", n: 1 }
    case "sum":
      return { type: "sum", a: derivRaw(expr.a), b: derivRaw(expr.b) }
    case "call":
      return {
        type: "prod",
        a: derivRaw(expr.body),
        b: {
          type: "call",
          name: expr.name,
          ticks: expr.ticks + 1,
          body: expr.body,
        },
      }
    case "prod":
      return {
        type: "sum",
        a: {
          type: "prod",
          a: expr.a,
          b: derivRaw(expr.b),
        },
        b: {
          type: "prod",
          a: expr.b,
          b: derivRaw(expr.a),
        },
      }
    case "const":
      return { type: "const", n: 0 }
  }
}

export function simplify(expr: Expr): Expr {
  switch (expr.type) {
    case "x":
    case "const":
      return expr
    case "call":
      return { ...expr, body: simplify(expr.body) }
    case "prod": {
      const a = simplify(expr.a)
      const b = simplify(expr.b)

      if (a.type == "const") {
        if (b.type == "const") {
          return { type: "const", n: a.n * b.n }
        } else if (a.n == 0) {
          return { type: "const", n: 0 }
        } else if (a.n == 1) {
          return b
        }
      } else if (b.type == "const") {
        if (b.n == 0) {
          return { type: "const", n: 0 }
        } else if (b.n == 1) {
          return a
        }
      }

      return { type: "prod", a, b }
    }
    case "sum": {
      const a = simplify(expr.a)
      const b = simplify(expr.b)

      if (a.type == "const") {
        if (b.type == "const") {
          return { type: "const", n: a.n + b.n }
        } else if (a.n == 0) {
          return b
        }
      } else if (b.type == "const") {
        if (b.n == 0) {
          return a
        }
      }

      return { type: "sum", a, b }
    }
  }
}

export function expand(expr: Expr): [ExprNoSum, ...ExprNoSum[]] {
  if (expr.type == "sum") {
    return [...expand(expr.a), ...expand(expr.b)]
  } else if (expr.type == "prod") {
    const a = expand(expr.a)
    const b = expand(expr.b)
    return a.flatMap((a): ExprNoSum[] =>
      b.map((b) => ({ type: "prod", a, b })),
    ) as any
  }
  return [expr]
}

export function order(a: Expr, b: Expr): number {
  if (a.type == "const") {
    return -1
  }
  if (b.type == "const") {
    return 1
  }
  if (a.type == "x") {
    return -1
  }
  if (b.type == "x") {
    return 1
  }
  if (a.type == "call" && b.type == "call") {
    return a.name < b.name
      ? -1
      : a.name > b.name
      ? 1
      : a.ticks < b.ticks
      ? -1
      : a.ticks > b.ticks
      ? 1
      : 0
  }
  if (a.type == "call") {
    return -1
  }
  if (b.type == "call") {
    return 1
  }
  if (a.type == "prod" && b.type == "prod") {
    return order(a.a, b.a) || order(b.a, b.b)
  }
  return 0
}

export function unexpand(expr: [Expr, ...Expr[]]): Expr {
  return expr.reduce((a, b) => ({ type: "sum", a, b }))
}

export function multiplied(expr: ExprNoSum): ExprLeaf[] {
  if (expr.type == "prod") {
    return [...multiplied(expr.a), ...multiplied(expr.b)]
  } else {
    return [expr]
  }
}

export function sort(expr: ExprNoSum): ExprNoSum {
  switch (expr.type) {
    case "x":
    case "const":
      return expr
    case "call":
      return {
        type: "call",
        name: expr.name,
        ticks: expr.ticks,
        body: unexpand(expand(expr.body).map(sort) satisfies Expr[] as any),
      }
    case "prod":
      return multiplied(expr)
        .map(sort)
        .sort(order)
        .reduce((a, b) => ({ type: "prod", a, b }))
  }
}

export function deriv(expr: Expr): Expr {
  return simplify(
    expand(simplify(derivRaw(expr)))
      .map(simplify)
      .reduce((a, b) => ({ type: "sum", a, b })),
  )
}

export function str(expr: Expr): string {
  switch (expr.type) {
    case "x":
      return "x"
    case "const":
      return expr.n.toString()
    case "call":
      return (
        expr.name +
        (["", "¹", "²", "³", "⁴"][expr.ticks] || "'".repeat(expr.ticks)) +
        (expr.body.type == "x" ? "" : "(" + str(expr.body) + ")")
      )
    case "prod":
      return str(expr.a) + " " + str(expr.b)
    case "sum":
      return `(${str(expr.a)} + ${str(expr.b)})`
  }
}

export function estr(expr: Expr): string {
  return "\n  " + expand(expr).map(sort).sort(order).map(str).join("\n+ ")
}

console.log(estr(INITIAL))
console.log(estr(deriv(INITIAL)))
console.log(estr(deriv(deriv(INITIAL))))
console.log(estr(deriv(deriv(deriv(INITIAL)))))
console.log(estr(deriv(deriv(deriv(deriv(INITIAL))))))
console.log(estr(deriv(deriv(deriv(deriv(deriv(INITIAL)))))))
