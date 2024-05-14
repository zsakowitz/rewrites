/** Definition types
 *
 * builtin value          represented as only its type
 * builtin function       represented as an array of type signatures
 *
 * user-defined function  represented as parameter list and output expression
 * user-defined value     represented as a single expression
 *
 */

/** An expression definition. */
export type Definition =
  | { type: "bval"; ty: Ty; decl: string }
  | { type: "bfn"; def: BFnDefn[] }
  | { type: "uval"; expression: Expression }
  | { type: "ufn"; params: string[]; output: Expression }

/** The type of an expression. */
export type Ty = "int" | "float" | "intlist" | "floatlist"

/** The type of a builtin function. */
export type BFnDefn = { params: Ty[]; output: Ty; decl: string }

/** An expression. */
export type Expression =
  | { type: "val"; name: string } // value from variable name (pi)
  | { type: "bval"; ty: Ty } // builtin value (23, true)
  | { type: "fn"; name: string; args: Expression[] } // function call
  | { type: "local"; names: string[]; value: Expression } // local (for, sum)

/** A list of names this item depends on. */
export type Deps = { vars: string[]; fns: string[] }

/** A list of definitions. */
export type ScriptObject = Record<string, Definition>

export type IsOrderWellDefinedResult =
  | { ok: true }
  | { ok: false; reason: "fn-var conflict"; name: string }
  | { ok: false; reason: "cycle" }
  | { ok: false; reason: "undefined var" }
  | { ok: false; reason: "self-ref"; name: string }

/** Gets the dependencies of a given function. */
export function getDeps(expression: Expression): Deps {
  switch (expression.type) {
    case "val":
      return { vars: [expression.name], fns: [] }

    case "bval":
      return { vars: [], fns: [] }

    case "fn": {
      const vars: string[] = []
      const fns = [expression.name]

      for (const param of expression.args) {
        const deps = getDeps(param)
        for (const name of deps.vars) {
          if (!vars.includes(name)) {
            vars.push(name)
          }
        }
        for (const name of deps.fns) {
          if (!fns.includes(name)) {
            fns.push(name)
          }
        }
      }

      return { vars, fns }
    }

    case "local": {
      const { vars, fns } = getDeps(expression.value)

      return {
        vars: vars.filter((x) => !expression.names.includes(x)),
        fns: fns.filter((x) => !expression.names.includes(x)),
      }
    }
  }
}

/** Makes sure there are no cyclic or missing function definitions. */
export function isOrderWellDefined(
  list: ScriptObject,
): IsOrderWellDefinedResult {
  const entries = Object.entries(list)
  const keys = entries.map((x) => x[0])
  const seenFns: string[] = []
  const seenVars: string[] = []

  for (let i = 0; i < entries.length; i++) {
    const [k, v] = entries[i]!

    if (v.type == "bfn" || v.type == "bval") {
      if (v.type == "bfn") {
        if (seenVars.includes(k)) {
          return { ok: false, reason: "fn-var conflict", name: k }
        }
        seenFns.push(k)
      } else {
        if (seenFns.includes(k)) {
          return { ok: false, reason: "fn-var conflict", name: k }
        }
        seenVars.push(k)
      }

      entries.splice(i, 1)
      i--
    }
  }

  if (entries.length == 0) {
    return { ok: true }
  }

  const reducedEntries = entries as [
    string,
    Exclude<Definition, { type: "bfn" | "bval" }>,
  ][]

  for (const [k, v] of reducedEntries) {
    const { vars, fns } = getDeps(
      v.type == "ufn"
        ? { type: "local", names: v.params, value: v.output }
        : v.expression,
    )

    if (vars.includes(k) || fns.includes(k)) {
      return { ok: false, reason: "self-ref", name: k }
    }
  }

  const [allVars, allFns] = reducedEntries.reduce(
    ([vars, fns], [, v]) => {
      const deps = getDeps(
        v.type == "ufn"
          ? { type: "local", names: v.params, value: v.output }
          : v.expression,
      )

      vars.push(...deps.vars)
      fns.push(...deps.fns)

      return [vars, fns] as const
    },
    [seenVars.slice(), seenFns.slice()] as const,
  )

  for (const name of allVars) {
    if (allFns.includes(name)) {
      return { ok: false, reason: "fn-var conflict", name }
    }

    if (!keys.includes(name)) {
      return { ok: false, reason: "undefined var" }
    }
  }

  for (const name of allFns) {
    if (!keys.includes(name)) {
      return { ok: false, reason: "undefined var" }
    }
  }

  let lastEntriesLength = reducedEntries.length
  while (true) {
    for (let i = 0; i < reducedEntries.length; i++) {
      const [k, v] = reducedEntries[i]!

      const { vars, fns } = getDeps(
        v.type == "ufn"
          ? { type: "local", names: v.params, value: v.output }
          : v.expression,
      )

      if (
        vars.every((x) => seenVars.includes(x)) &&
        fns.every((x) => seenFns.includes(x))
      ) {
        if (v.type == "ufn") {
          seenFns.push(k)
        } else {
          seenVars.push(k)
        }
      }

      reducedEntries.splice(i, 1)
      i--
    }

    if (reducedEntries.length == 0) {
      return { ok: true }
    }

    if (reducedEntries.length == lastEntriesLength) {
      return { ok: false, reason: "cycle" }
    }
  }
}

// pi :: float
// e :: float
// a = pi
// b = c(a)
// c(d) = d
// f = c(b)

const MAIN_SCRIPT: ScriptObject = {
  pi: {
    type: "bval",
    ty: "float",
    decl: "float pi = 3.1415926;",
  },
  e: {
    type: "bval",
    ty: "float",
    decl: "float e = 2.718281828;",
  },
  a: {
    type: "uval",
    expression: { type: "val", name: "pi" },
  },
  b: {
    type: "uval",
    expression: { type: "fn", name: "c", args: [{ type: "val", name: "a" }] },
  },
  c: {
    type: "ufn",
    params: ["d"],
    output: { type: "val", name: "d" },
  },
  f: {
    type: "uval",
    expression: { type: "fn", name: "c", args: [{ type: "val", name: "b" }] },
  },
}
