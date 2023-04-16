// Parses simple math expressions.

import * as Z from "../parsers/parser-5"

export type Number = {
  type: "number"
  complex: boolean
  value: number
}

export type Variable = {
  type: "variable"
  complex: boolean
  name: string
}

export type Range = {
  type: "range"
  complex: boolean
  start: Expression
  end: Expression
}

export type Prefix = {
  type: "prefix"
  complex: boolean
  arg: Expression
  operator: "+" | "-"
}

export type SumOrProduct = {
  type: "sum" | "prod"
  complex: boolean
  name: Variable
  start: Expression
  end: Expression
  expr: Expression
}

export type Point = {
  type: "point"
  complex: true
  x: Expression
  y: Expression
}

export type FunctionCall = {
  type: "function_call"
  complex: boolean
  name: Variable
  args: Expression[]
}

export type MemberCall = {
  type: "member_call"
  complex: boolean
  target: Expression
  property: Variable
  args: Expression[]
}

export type PropertyAccess = {
  type: "property_access"
  complex: boolean
  target: Expression
  property: Variable
}

export type IndexedAccess = {
  type: "indexed_access"
  complex: boolean
  target: Expression
  index: Expression
}

export type BinaryOp = {
  type: "+" | "-" | "*" | "/" | "^" | "<" | ">" | "<=" | ">=" | "="
  complex: boolean
  left: Expression
  right: Expression
}

export type List = {
  type: "list"
  complex: boolean
  elements: Expression[]
}

export type SquareRoot = {
  type: "square_root"
  complex: boolean
  arg: Expression
}

export type NthRoot = {
  type: "nth_root"
  complex: boolean
  root: Expression
  arg: Expression
}

export type ArbitraryLog = {
  type: "arbitrary_log"
  complex: boolean
  base: Expression
  arg: Expression
}

export type Expression =
  | Number
  | Variable
  | Range
  | Prefix
  | SumOrProduct
  | Point
  | FunctionCall
  | MemberCall
  | PropertyAccess
  | IndexedAccess
  | BinaryOp
  | List
  | SquareRoot
  | NthRoot
  | ArbitraryLog

function asComplex(expr: Expression): Expression {
  if (expr.complex) {
    return expr
  }

  return {
    type: "point",
    complex: true,
    x: expr,
    y: { type: "number", complex: false, value: 0 },
  }
}

const optionalWhitespace = Z.regex(/^\s*/).void()

const whitespace = Z.regex(/^\s+/).void()

const expression: Z.Parser<Expression> = Z.lazy(() => maybeConditional)

const comma = Z.regex(/^\s*,\s*/).void()

// #region atoms

const atom: Z.Parser<Expression> = Z.lazy(() =>
  Z.seq(
    Z.any(
      parenthesized,
      sumOrProduct,
      implicitFunctionCall,
      functionCall,
      prefix,
      point,
      list,
      number,
      variable,
    ),
    Z.many(
      Z.seq(
        optionalWhitespace,
        Z.any(
          Z.seq(
            Z.text("."),
            optionalWhitespace,
            variable,
            optionalWhitespace,
            args,
          ).map(([, , property, , args]) => ({
            type: "member_call" as const,
            args,
            property,
          })),
          Z.seq(Z.text("."), optionalWhitespace, variable).map(
            ([, , property]) => ({
              type: "property_access" as const,
              property,
            }),
          ),
          Z.seq(
            Z.text("["),
            optionalWhitespace,
            expression,
            optionalWhitespace,
            Z.text("]"),
          ).map(([, , index]) => ({
            type: "indexed_access" as const,
            index,
          })),
        ),
      ).map((value) => value[1]),
    ),
  ).map(([head, tail]) =>
    tail.reduce<Expression>(
      (target, rest) => ({
        ...rest,
        target,
        complex:
          // All operations give real (or unknown) results except indexing into a
          // list of complex numbers.
          rest.type == "indexed_access" && target.complex,
      }),
      head,
    ),
  ),
)

const parenthesized: Z.Parser<Expression> = Z.seq(
  Z.text("("),
  optionalWhitespace,
  expression,
  optionalWhitespace,
  Z.text(")"),
).map((match) => match[2])

const plainNumber = Z.regex(/^\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?/).map<Number>(
  ([value]) => {
    return {
      type: "number",
      complex: false,
      value: +value,
    }
  },
)

const number = Z.seq(
  plainNumber,
  Z.optional(Z.seq(optionalWhitespace, Z.text("i"))),
).map<Number | Point>(([number, i]) => {
  if (i) {
    return {
      type: "point",
      complex: true,
      x: {
        type: "number",
        complex: false,
        value: 0,
      },
      y: number,
    }
  } else {
    return number
  }
})

const variable = Z.regex(
  /^(?!sum|prod|root|of)[A-Za-z][A-Za-z0-9]*/,
).map<Variable>(([value]) => ({
  type: "variable",
  complex: value.startsWith("z") || value == "i",
  name: value,
}))

const prefix = Z.seq(
  Z.any(Z.text("+"), Z.text("-")),
  optionalWhitespace,
  Z.lazy(() => multiplicationOrDivisionChain),
).map<Prefix>(([operator, , arg]) => ({
  type: "prefix",
  complex: arg.complex,
  operator,
  arg,
}))

const sumOrProduct = Z.seq(
  Z.any(Z.text("sum"), Z.text("prod")),
  optionalWhitespace,
  Z.text("("),
  optionalWhitespace,
  variable,
  optionalWhitespace,
  Z.text("="),
  optionalWhitespace,
  Z.lazy(() => additionOrSubtractionChain),
  optionalWhitespace,
  Z.text("..."),
  optionalWhitespace,
  Z.lazy(() => additionOrSubtractionChain),
  optionalWhitespace,
  Z.text(")"),
  optionalWhitespace,
  Z.lazy(() => exponentChain),
).map<SumOrProduct>(
  ([type, , , , name, , , , start, , , , end, , , , expr]) => ({
    type,
    complex:
      // There's currently no way to do arbitrary complex products.
      type == "sum" && expr.complex,
    name,
    start,
    end,
    expr,
  }),
)

const point = Z.seq(
  Z.text("("),
  optionalWhitespace,
  expression,
  optionalWhitespace,
  Z.text(","),
  optionalWhitespace,
  expression,
  optionalWhitespace,
  Z.text(")"),
).map<Point>(([, , x, , , , y]) => ({
  type: "point",
  complex: true, // Points are assumed to be complex numbers.
  x,
  y,
}))

const args = Z.seq(
  Z.text("("),
  optionalWhitespace,
  Z.sepBy(expression, comma),
  optionalWhitespace,
  Z.optional(comma),
  Z.text(")"),
).map((value) => value[2])

const functionCall = Z.seq(variable, optionalWhitespace, args).map<Expression>(
  ([name, , args]) => {
    if (name.name == "sqrt" && args.length == 1) {
      return {
        type: "square_root",
        complex: args[0]!.complex,
        arg: args[0]!,
      }
    }

    if (name.name == "log" && args.length == 2) {
      const base = args[0]!
      const arg = args[1]!
      const isComplex = base.complex || arg.complex

      return {
        type: "arbitrary_log",
        complex: isComplex,
        base: isComplex ? asComplex(base) : base,
        arg: isComplex ? asComplex(arg) : arg,
      }
    }

    const isComplex = args.some((arg) => arg.complex)

    return {
      type: "function_call",
      complex: isComplex, // Function calls are technically unknown.
      name,
      args: isComplex ? args.map(asComplex) : args,
    }
  },
)

const implicitFunctionCall = Z.seq(
  variable,
  whitespace,
  Z.not(Z.lookahead(Z.regex(/^\s*[+\-*/^]/))),
  Z.lazy(() => multiplicationOrDivisionChain),
).map<Expression>(([name, , , arg]) => {
  if (name.name == "sqrt") {
    return {
      type: "square_root",
      complex: arg.complex,
      arg,
    }
  }

  return {
    type: "function_call",
    complex: arg.complex, // Function calls are technically unknown.
    name,
    args: [arg],
  }
})

const list = Z.seq(
  Z.text("["),
  optionalWhitespace,
  Z.sepBy(expression, comma),
  optionalWhitespace,
  Z.optional(comma),
  Z.text("]"),
).map<List>(([, , elements]) => ({
  type: "list",
  complex:
    // Lists are marked complex if any of their elements are complex.
    elements.some((expr) => expr.complex),
  elements: elements.some((expr) => expr.complex)
    ? elements.map(asComplex)
    : elements,
}))

// #endregion

const exponentChain = Z.seq(
  atom,
  Z.many(
    Z.seq(optionalWhitespace, Z.text("^"), optionalWhitespace, atom).map(
      (value) => value[3],
    ),
  ),
).map<Expression>(([head, tail]) => {
  for (const item of tail) {
    const isComplex = head.complex || item.complex

    if (head.type == "variable" && head.name == "e") {
      if (isComplex) {
        head = {
          type: "function_call",
          name: {
            type: "variable",
            complex: false,
            name: "cexp",
          },
          args: [asComplex(item)],
          complex: true,
        }
      } else {
        head = {
          type: "function_call",
          name: {
            type: "variable",
            complex: false,
            name: "exp",
          },
          args: [item],
          complex: false,
        }
      }
    } else {
      head = {
        type: "^",
        complex: isComplex,
        left: isComplex ? asComplex(head) : head,
        right: isComplex ? asComplex(item) : item,
      }
    }
  }

  return head
})

const multiplicationOrDivisionChain = Z.seq(
  exponentChain,
  Z.many(
    Z.seq(
      optionalWhitespace,
      Z.any(Z.text("*"), Z.text("/")),
      optionalWhitespace,
      exponentChain,
    ),
  ),
).map<Expression>(([head, tail]) => {
  for (const item of tail) {
    const isComplex = head.complex || item[3].complex

    head = {
      type: item[1],
      complex: isComplex,
      left: isComplex ? asComplex(head) : head,
      right: isComplex ? asComplex(item[3]) : item[3],
    }
  }

  return head
})

const nthRootChain = Z.seq(
  multiplicationOrDivisionChain,
  Z.many(
    Z.seq(
      optionalWhitespace,
      Z.text("root"),
      optionalWhitespace,
      Z.text("of"),
      optionalWhitespace,
      multiplicationOrDivisionChain,
    ).map((value) => value[5]),
  ),
).map<Expression>(([head, tail]) => {
  for (const item of tail) {
    const isComplex = head.complex || item.complex

    head = {
      type: "nth_root",
      complex: isComplex,
      root: isComplex ? asComplex(head) : head,
      arg: isComplex ? asComplex(item) : item,
    }
  }

  return head
})

const additionOrSubtractionChain = Z.seq(
  nthRootChain,
  Z.many(
    Z.seq(
      optionalWhitespace,
      Z.any(Z.text("+"), Z.text("-")),
      optionalWhitespace,
      nthRootChain,
    ),
  ),
).map<Expression>(([head, tail]) => {
  for (const item of tail) {
    const isComplex = head.complex || item[3].complex

    head = {
      type: item[1],
      complex: isComplex,
      left: isComplex ? asComplex(head) : head,
      right: isComplex ? asComplex(item[3]) : item[3],
    }
  }

  return head
})

const maybeRange = Z.seq(
  additionOrSubtractionChain,
  Z.optional(
    Z.seq(
      optionalWhitespace,
      Z.text("..."),
      optionalWhitespace,
      additionOrSubtractionChain,
    ).map((value) => value[3]),
  ),
).map<Expression>(([start, end]) => {
  if (end) {
    if (start.complex || end.complex) {
      throw new Error("Complex ranges are not supported yet.")
    }

    return {
      type: "range",
      complex: false,
      start,
      end,
    }
  }

  return start
})

const maybeConditional = Z.seq(
  maybeRange,
  Z.many(
    Z.seq(
      optionalWhitespace,
      Z.any(Z.text("<="), Z.text(">="), Z.text("<"), Z.text(">"), Z.text("=")),
      optionalWhitespace,
      maybeRange,
    ),
  ),
).map(([head, tail]) => {
  for (const item of tail) {
    if (item[1] == "=") {
      const isComplex = head.complex || item[3].complex

      head = {
        type: item[1],
        complex: isComplex,
        left: isComplex ? asComplex(head) : head,
        right: isComplex ? asComplex(item[3]) : item[3],
      }
    } else {
      if (head.complex || item[3].complex) {
        throw new Error("Complex comparisons are not supported yet.")
      }

      head = {
        type: item[1],
        complex: false,
        left: head,
        right: item[3],
      }
    }
  }

  return head
})

const complete = Z.seq(maybeConditional, Z.not(Z.char)).map((value) => value[0])

export { complete as expression }
