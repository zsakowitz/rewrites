const MAX_DYNAMIC_LIST_SIZE = 10_000

export type KindName = "float" | "int" | "bool"

export class Kind {
  readonly type = "kind"
  readonly str: string

  constructor(
    readonly kind: KindName,
    readonly list?: number | true | undefined,
  ) {
    this.str = this.kind
    Object.freeze(this)
  }

  asNonList() {
    if (this.list == null) {
      throw new Error("Already is a list.")
    }

    return new Kind(this.kind)
  }

  asList(list: number | true) {
    if (this.list != null) {
      throw new Error("Cannot nest lists.")
    }

    return new Kind(this.kind, list)
  }

  toString(): string {
    return this.str
  }

  toGlsl(scriptifier: Scriptifier): string {
    const raw = {
      float: "float",
      bool: "bool",
      int: "int",
    }[this.kind]

    if (typeof this.list == "number") {
      return `${raw}[${this.list}]`
    }

    if (this.list === true) {
      return scriptifier.structKind({
        length: new Kind("int"),
        data: new Kind(this.kind, MAX_DYNAMIC_LIST_SIZE),
      })
    }

    return raw
  }
}

export class Signature {
  readonly str: string

  constructor(readonly args: Kind[]) {
    this.str = `(${this.args.join(",")}->)`
    Object.freeze(this)
  }

  toString() {
    return this.str
  }
}

export type Value =
  | { type: "local"; name: string }
  | { type: "bind"; name: string; bound: Value; contents: Value }
  | { type: "fn"; name: string; args: Value[] }
  | { type: "bval"; value: ScriptValue }

export type Item =
  | { type: "val"; value: Value }
  | { type: "fn"; args: string[]; value: Value }
  | { type: "bfn"; call: Fn }

export type Globals = { readonly [name: string]: Item | undefined }
export type Locals = { [name: string]: ScriptValue | undefined }
export type Functions = { [name: string | symbol]: ScriptValue }
export type Structs = { [name: string]: string }

export type Fn = (this: Scriptifier, args: ScriptValue[]) => ScriptValue

export class Error extends globalThis.Error {}

export class MissingError extends globalThis.Error {
  constructor(readonly missingItem: string) {
    super(`${missingItem} does not exist`)
  }
}

export class LocalFunctionsNotSupportedError extends globalThis.Error {
  constructor(readonly itemUsed: string) {
    super(`Local functions are not supported yet`)
  }
}

export class NameHasher {
  static random(hint: string | symbol) {
    return (
      "xx" +
      String(hint).replace(/[^A-Za-z0-9]/g, "") +
      Math.random().toString().slice(2)
    )
  }

  readonly names: { [item: string | symbol]: { [kind: string]: string } } =
    Object.create(null)

  constructor() {
    Object.freeze(this)
  }

  get(name: string | symbol, kind: Kind | Signature) {
    const kinds = (this.names[name] ??= Object.create(null))
    return (kinds[kind.str] ??= NameHasher.random(name))
  }

  structFromEntries(entries: [string, ScriptValue][]) {
    const name = `struct(${entries
      .map(([name, value]) => `${value.kind} ${name}`)
      .join(",")})`
    const kinds = (this.names[name] ??= Object.create(null))
    return (kinds["__struct"] ??= NameHasher.random("struct"))
  }

  structFromKind(entries: [string, Kind][]) {
    const name = `struct(${entries
      .map(([name, value]) => `${value} ${name}`)
      .join(",")})`
    const kinds = (this.names[name] ??= Object.create(null))
    return (kinds["__struct"] ??= NameHasher.random("struct"))
  }
}

export class ScriptValue {
  static readonly boollistToFloatlist = Symbol()

  constructor(readonly script: string, readonly kind: Kind) {
    Object.freeze(this)
  }

  #brand: unknown

  toString() {
    return `(${this.script})`
  }

  toFloat() {
    return new ScriptValue(
      {
        bool: `${this} ? 1.0 : 0.0 / 0.0`,
        float: this.script,
        int: `float(${this})`,
      }[this.kind.kind],
      new Kind("float"),
    )
  }
}

function defaultImplicitFn(
  this: Scriptifier,
  args: ScriptValue[],
): ScriptValue {
  throw new Error("This calculator does not support implicit multiplication.")
}

function defaultPointFn(this: Scriptifier, args: ScriptValue[]): ScriptValue {
  throw new Error("This calculator does not support points.")
}

export class Scriptifier {
  locals: Locals = Object.create(null)
  fns: Functions = Object.create(null)
  structs: Structs = Object.create(null)
  names = new NameHasher()

  constructor(
    readonly globals: Globals = Object.create(null),
    readonly implicitFn: Fn = defaultImplicitFn,
    readonly pointFn: Fn = defaultPointFn,
  ) {
    Object.freeze(this)
  }

  reset() {
    this.locals = Object.create(null)
    this.fns = Object.create(null)
    this.names = new NameHasher()
  }

  clone(): Scriptifier {
    return new Scriptifier(this.globals, this.implicitFn, this.pointFn)
  }

  extend(globals: Globals): Scriptifier {
    return new Scriptifier(
      Object.assign(Object.create(null), this.globals, globals),
      this.implicitFn,
      this.pointFn,
    )
  }

  valueToScript(value: Value): ScriptValue {
    const { locals, globals } = this

    switch (value.type) {
      case "bval":
        return value.value

      case "local": {
        const l = locals[value.name]
        if (l) {
          return l
        }

        const g = globals[value.name]
        if (g) {
          return this.itemToScript(value.name, g)
        }

        throw new MissingError(value.name)
      }

      case "bind": {
        const prev = locals[value.name]
        locals[value.name] = this.valueToScript(value.bound)
        const data = this.valueToScript(value.contents)
        locals[value.name] = prev
        return data
      }

      case "fn": {
        if (locals[value.name] != null) {
          throw new LocalFunctionsNotSupportedError(value.name)
        }

        const g = globals[value.name]
        if (g == null) {
          throw new MissingError(value.name)
        }

        const args = value.args.map((value) => this.valueToScript(value))

        return this.fnToScript(value.name, g, args)
      }
    }
  }

  itemToScript(name: string, item: Item): ScriptValue {
    switch (item.type) {
      case "val":
        return this.valueToScript(item.value)

      case "fn":
        throw new Error(`${name} is a function. Try using parentheses.`)

      case "bfn":
        throw new Error(`${name} is a function. Try using parentheses.`)
    }
  }

  fnToScript(name: string, item: Item, args: ScriptValue[]): ScriptValue {
    switch (item.type) {
      case "val":
        throw new Error("TODO: implement implicit multiplication")

      case "fn": {
        if (item.args.length != args.length) {
          throw new Error(`${name} takes ${item.args.length} parameters.`)
        }

        if (item.args.some((x, i, a) => a.indexOf(x) != i)) {
          throw new Error(`${name} has multiple parameters with the same name.`)
        }

        return this.callFn(
          name,
          args,
          () => this.valueToScript(item.value),
          (index) => item.args[index]!,
        )
      }

      case "bfn": {
        return item.call.call(this, args)
      }
    }
  }

  // INVARIANT: the output returned by `value` should be relatively equal
  // no matter where this instance of `callFn` is called.
  //
  // `callFn` should not be called with name "+" twice with the same argument
  // kinds and a different return value.
  callFn<const T extends readonly ScriptValue[]>(
    name: string | symbol,
    args: T,
    value: (args: {
      [K in keyof T]: ScriptValue
    }) => ScriptValue,
    getArgName: (index: number) => string = (index) =>
      NameHasher.random(index + "arg"),
  ): ScriptValue {
    const fnSignature = new Signature(args.map((x) => x.kind))
    const fnName = this.names.get(name, fnSignature)
    const cachedFn = this.fns[fnName]
    if (cachedFn) {
      return new ScriptValue(`${fnName}(${args.join(", ")})`, cachedFn.kind)
    }

    const hashedParams: ScriptValue[] = []
    const old = Object.create(null)
    for (let index = 0; index < args.length; index++) {
      const value = args[index]!
      const argName = getArgName(index)
      old[argName] = this.locals[argName]
      const hashedName = this.names.get(argName, value.kind)
      hashedParams.push(new ScriptValue(hashedName, value.kind))
      this.locals[argName] = new ScriptValue(hashedName, value.kind)
    }

    const retval = value(hashedParams as any)

    for (const name in old) {
      this.locals[name] = old[name]
    }

    this.fns[fnName] = new ScriptValue(
      `${retval.kind.toGlsl(this)} ${fnName}(${hashedParams
        .map((x) => `${x.kind.toGlsl(this)} ${x.script}`)
        .join(",")}) {${
        retval.script.includes("return")
          ? "\n" + retval.script + "\n"
          : " return " + retval.script + "; "
      }}`,
      retval.kind,
    )

    return new ScriptValue(`${fnName}(${args.join(", ")})`, retval.kind)
  }

  struct(fields: Record<string, ScriptValue>): string {
    const entries = Object.entries(fields).sort(([a], [b]) => (a < b ? -1 : 1))
    const name = this.names.structFromEntries(entries)
    if (name in this.structs) {
      return `${name}(${entries.map((x) => x[1]).join(", ")})`
    }
    this.structs[name] = `struct ${name} {${entries
      .map(([name, value]) => `\n  ${value.kind.toGlsl(this)} ${name};`)
      .join("")}
};`
    return `${name}(${entries.map((x) => x[1]).join(", ")})`
  }

  structKind(fields: Record<string, Kind>): string {
    const entries = Object.entries(fields).sort(([a], [b]) => (a < b ? -1 : 1))
    const name = this.names.structFromKind(entries)
    if (name in this.structs) {
      return name
    }
    this.structs[name] = `struct ${name} {${entries
      .map(([name, value]) => `\n  ${value.toGlsl(this)} ${name};`)
      .join("")}
};`
    return `${name}`
  }

  // INVARIANT: `fn` should be identical for any call with a given `name`
  collate<const T extends readonly ScriptValue[]>(
    name: string | symbol,
    args: T,
    fn: (args: {
      [K in keyof T]: ScriptValue & { kind: { list: undefined } }
    }) => ScriptValue,
  ): ScriptValue {
    if (args.every((x) => x.kind.list == null)) {
      return fn(args as any)
    }

    if (
      args.every((x) => x.kind.list == null || typeof x.kind.list == "number")
    ) {
      const size = args.reduce(
        (a, b) =>
          typeof b.kind.list == "number" ? Math.min(b.kind.list, a) : a,
        Infinity,
      )
      return this.callFn(name, args, (args) => {
        const index = NameHasher.random("input")
        const output = NameHasher.random("output")
        const value: ScriptValue = fn(
          args.map((arg) => {
            if (typeof arg.kind.list == "number") {
              return new ScriptValue(`${arg}[${index}]`, arg.kind.asNonList())
            } else {
              return arg
            }
          }) as any,
        )
        const retkind = value.kind.asList(size)
        return new ScriptValue(
          // TODO: how to properly initialize this list given its length
          `${retkind.toGlsl(this)} ${output} = [];
for (int ${index} = 0; ${index} < ${size}; ${index}++) {
  ${output}[${index}] = ${value};
}
return ${output};`,
          retkind,
        )
      })
    }

    const maxSize = args.reduce(
      (a, b) => (typeof b.kind.list == "number" ? Math.min(b.kind.list, a) : a),
      MAX_DYNAMIC_LIST_SIZE,
    )
    return this.callFn(name, args, (args) => {
      const index = NameHasher.random("index")
      const output = NameHasher.random("output")
      const size = NameHasher.random("size")
      const value: ScriptValue = fn(
        args.map((arg) => {
          if (typeof arg.kind.list == "number") {
            return new ScriptValue(`${arg}[${index}]`, arg.kind.asNonList())
          } else if (arg.kind.list == true) {
            return new ScriptValue(
              `${arg}.data[${index}]`,
              arg.kind.asNonList(),
            )
          } else {
            return arg
          }
        }) as any,
      )
      const retkind = value.kind.asList(true)
      return new ScriptValue(
        // TODO: how to properly initialize this list given its length
        `${value.kind
          .asList(MAX_DYNAMIC_LIST_SIZE)
          .toGlsl(this)} ${output} = [];
int ${size} = ${args.reduce((size, arg) => {
          if (arg.kind.list === true) {
            return new ScriptValue(
              `min(${size}, ${arg}.length)`,
              new Kind("int"),
            )
          } else {
            return size
          }
        }, new ScriptValue("" + maxSize, new Kind("int")))};
for (int ${index} = 0; ${index} < ${MAX_DYNAMIC_LIST_SIZE}; ${index}++) {
  if (${index} >= ${size}) { break; }
  ${output}[${index}] = ${value};
}
return ${this.struct({
          length: new ScriptValue(size, new Kind("int")),
          data: new ScriptValue(
            output,
            value.kind.asList(MAX_DYNAMIC_LIST_SIZE),
          ),
        })};`,
        retkind,
      )
    })
  }
}

export class Bval {
  readonly type = "val"
  readonly value: Value

  constructor(value: string, kind: Kind) {
    this.value = Object.freeze({
      type: "bval",
      value: new ScriptValue(value, kind),
    })
    Object.freeze(this)
  }
}

export class Bfn {
  readonly type = "bfn"

  constructor(readonly call: Fn) {}
}

export const basic = new Scriptifier({
  pi: new Bval("" + Math.PI, new Kind("float")),
  e: new Bval("" + Math.E, new Kind("float")),
  true: new Bval("true", new Kind("bool")),
  false: new Bval("false", new Kind("bool")),
  "+": new Bfn(function (args) {
    // prefix `+` operator
    if (args.length == 1) {
      return args[0]!
    }

    if (args.length != 2) {
      throw new Error("`+` needs something on either side.")
    }

    return new ScriptValue(
      `${args[0]!.toFloat()} + ${args[1]!.toFloat()}`,
      new Kind("float"),
    )
  }),
  "-": new Bfn(function (args) {
    // prefix `-` operator
    if (args.length == 1) {
      return new ScriptValue(`-${args[0]!.toFloat()}`, new Kind("float"))
    }

    if (args.length != 2) {
      throw new Error("`-` needs something on either side.")
    }

    return new ScriptValue(
      `${args[0]!.toFloat()} - ${args[1]!.toFloat()}`,
      new Kind("float"),
    )
  }),
  odot: new Bfn(function (args) {
    if (args.length != 2) {
      throw new Error("`\\odot` needs something on either side.")
    }

    return new ScriptValue(
      `${args[0]!.toFloat()} * ${args[1]!.toFloat()}`,
      new Kind("float"),
    )
  }),
  odiv: new Bfn(function (args) {
    if (args.length != 2) {
      throw new Error("`\\odiv` needs something on either side.")
    }

    return new ScriptValue(
      `${args[0]!.toFloat()} / ${args[1]!.toFloat()}`,
      new Kind("float"),
    )
  }),
})

// prettier-ignore
export const local = (name: string): Value =>
  ({ type: "local", name })
// prettier-ignore
export const bind = (name: string, bound: Value, contents: Value): Value =>
  ({ type: "bind", name, bound, contents })
// prettier-ignore
export const fn = (name: string, args: Value[]): Value =>
  ({ type: "fn", name, args })
// prettier-ignore
export const bval = (name: string, kind: Kind): Value =>
  ({ type: "bval", value: new ScriptValue(name, kind) })
