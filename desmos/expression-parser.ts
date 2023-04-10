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
  type: "+" | "-" | "*" | "/" | "^"
  complex: boolean
  left: Expression
  right: Expression
}

export type List = {
  type: "list"
  complex: boolean
  elements: Expression[]
}

export type Expression =
  | Number
  | Variable
  | Prefix
  | SumOrProduct
  | Point
  | FunctionCall
  | MemberCall
  | PropertyAccess
  | IndexedAccess
  | BinaryOp
  | List

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

const expression: Z.Parser<Expression> = Z.lazy(
  () => additionOrSubtractionChain,
)

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

const number = Z.regex(/^\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?i?/).map<
  Number | Point
>(([value]) => {
  const number: Number = {
    type: "number",
    complex: false,
    value: +(value.endsWith("i") ? value.slice(0, -1) : value),
  }

  if (value.endsWith("i")) {
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

const variable = Z.regex(/^(?!sum|prod)[A-Za-z][A-Za-z0-9]*/).map<Variable>(
  ([value]) => ({
    type: "variable",
    complex: value.startsWith("z"),
    name: value,
  }),
)

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
  expression,
  optionalWhitespace,
  Z.text("..."),
  optionalWhitespace,
  expression,
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
  Z.many(Z.seq(optionalWhitespace, expression).map((value) => value[1])),
  optionalWhitespace,
  Z.text(")"),
).map((value) => value[1])

const functionCall = Z.seq(
  variable,
  optionalWhitespace,
  args,
).map<FunctionCall>(([name, , args]) => ({
  type: "function_call",
  complex: false, // Function calls are technically unknown.
  name,
  args,
}))

const implicitFunctionCall = Z.seq(
  variable,
  optionalWhitespace,
  Z.not(Z.lookahead(Z.regex(/^\s*[+\-*/^]/))),
  Z.lazy(() => multiplicationOrDivisionChain),
).map<FunctionCall>(([name, , , arg]) => ({
  type: "function_call",
  complex: false, // Function calls are technically unknown.
  name,
  args: [arg],
}))

const list = Z.seq(
  Z.text("["),
  Z.many(Z.seq(optionalWhitespace, expression).map((value) => value[1])),
  optionalWhitespace,
  Z.text("]"),
).map<List>(([, elements]) => ({
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

const additionOrSubtractionChain = Z.seq(
  multiplicationOrDivisionChain,
  Z.many(
    Z.seq(
      optionalWhitespace,
      Z.any(Z.text("+"), Z.text("-")),
      optionalWhitespace,
      multiplicationOrDivisionChain,
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

export { additionOrSubtractionChain as expression }
