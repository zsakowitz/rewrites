export type Value =
  | {
      readonly type: "call"
      readonly name: string
      readonly args: readonly Value[]
    }
  | {
      readonly type: "var"
      readonly name: string
    }

export type Item =
  | {
      readonly type: "val"
      readonly value: Value
    }
  | {
      readonly type: "fn"
      readonly args: readonly string[]
      readonly out: Value
    }
  | {
      readonly type: "kval"
      readonly kind: Kind
    }
  | {
      readonly type: "kfn"
      readonly args: readonly Kind[]
      readonly out: Kind
    }

export type Kind = "float" | "floatList"

export interface Definition {
  readonly name: string
  readonly item: Item
  readonly deps: Dependencies
}

export interface Script {
  readonly [x: string]: Item
}

export interface OrderedScript {
  readonly script: Script
  readonly ordered: readonly Definition[]
}

export interface Dependencies {
  readonly vars: readonly string[]
  readonly fns: readonly string[]
}

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export function findValueDeps(value: Value): Dependencies {
  switch (value.type) {
    case "call":
      const vars: string[] = []
      const fns = [value.name]
      for (const arg of value.args) {
        const deps = findValueDeps(arg)
        fns.push(...deps.fns)
        vars.push(...deps.vars)
      }

      return {
        fns: fns.filter((x, i, a) => a.indexOf(x) == i),
        vars: vars.filter((x, i, a) => a.indexOf(x) == i),
      }

    case "var":
      return { vars: [value.name], fns: [] }
  }
}

export function findItemDeps(item: Item): Dependencies {
  switch (item.type) {
    case "val":
      return findValueDeps(item.value)

    case "fn":
      const { fns, vars } = findValueDeps(item.out)
      return {
        fns: fns.filter((x) => !item.args.includes(x)),
        vars: vars.filter((x) => !item.args.includes(x)),
      }

    case "kval":
    case "kfn":
      return { fns: [], vars: [] }
  }
}

export function sortDefs(script: Script): Result<OrderedScript, string> {
  const entries = Object.entries(script).map<Definition>(([name, item]) => ({
    name,
    item,
    deps: findItemDeps(item),
  }))

  const fns = entries
    .map((x) => x.deps.fns)
    .filter((x, i, a) => a.indexOf(x) == i)

  const vars = entries
    .map((x) => x.deps.vars)
    .filter((x, i, a) => a.indexOf(x) == i)

  for (const fn of fns) {
    if (vars.includes(fn)) {
      return {
        ok: false,
        error: `${fn} is used as both a variable and function.`,
      }
    }
  }

  const ordered: Definition[] = []
  const keys: string[] = []

  let entryCount = entries.length
  while (true) {
    if (entryCount == 0) {
      break
    }

    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index]!

      if (
        entry.deps.fns.every((x) => keys.includes(x)) &&
        entry.deps.vars.every((x) => keys.includes(x))
      ) {
        keys.push(entry.name)
        ordered.push(entry)
        entries.splice(index, 1)
        index--
      }
    }

    if (entries.length == 0) {
      break
    }

    if (entries.length == entryCount) {
      return { ok: false, error: "Circular definitions exist." }
    }
  }

  return {
    ok: true,
    value: {
      script,
      ordered,
    },
  }
}

export const script: Script = {
  pi: {
    type: "kval",
    kind: "float",
  },
  e: {
    type: "kval",
    kind: "float",
  },
  a: {
    type: "val",
    value: { type: "var", name: "pi" },
  },
  b: {
    type: "val",
    value: { type: "call", name: "c", args: [{ type: "var", name: "a" }] },
  },
  c: {
    type: "fn",
    args: ["d"],
    out: { type: "var", name: "d" },
  },
  f: {
    type: "val",
    value: { type: "call", name: "c", args: [{ type: "var", name: "b" }] },
  },
}

const orderedResult = sortDefs(script)

if (!orderedResult.ok) {
  throw new Error()
}

const ordered = orderedResult.value

function getTypes() {}
