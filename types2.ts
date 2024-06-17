export type KindName = "float" | "bool"

export class Kind {
  readonly type = "kind"
  readonly str: string
  // readonly list: number | true | undefined

  constructor(readonly kind: KindName) {
    this.str = this.kind
    Object.freeze(this)
  }

  toString(): string {
    return this.str
  }

  toGlsl(): string {
    const raw = {
      float: "float",
      bool: "bool",
    }[this.kind]

    // if (this.list === true) {
    //   return `List<${raw}>`
    // }

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
  static random() {
    return "xx" + Math.random().toString().slice(2, 12)
  }

  readonly names: { [item: string | symbol]: { [kind: string]: string } } =
    Object.create(null)

  constructor() {
    Object.freeze(this)
  }

  get(name: string | symbol, kind: Kind | Signature) {
    const kinds = (this.names[name] ??= Object.create(null))
    return (kinds[kind.str] ??= NameHasher.random())
  }

  structFromEntries(entries: [string, ScriptValue][]) {
    const name = `struct(${entries
      .map(([name, value]) => `${value.kind} ${name}`)
      .join(",")})`
    const kinds = (this.names[name] ??= Object.create(null))
    return (kinds["__struct"] ??= NameHasher.random())
  }

  structFromKind(entries: [string, Kind][]) {
    const name = `struct(${entries
      .map(([name, value]) => `${value} ${name}`)
      .join(",")})`
    const kinds = (this.names[name] ??= Object.create(null))
    return (kinds["__struct"] ??= NameHasher.random())
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
    name: string,
    args: T,
    value: (args: {
      [K in keyof T]: Omit<T[K], "script"> & { script: string }
    }) => ScriptValue,
    getArgName: (index: number) => string = NameHasher.random,
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
      `${retval.kind.toGlsl()} ${fnName}(${hashedParams
        .map((x) => `${x.kind.toGlsl()} ${x.script}`)
        .join(",")}) { return ${retval.script}; }`,
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
      .map(([name, value]) => `\n  ${value.kind.toGlsl()} ${name};`)
      .join("")}
};`
    return `${name}(${entries.map((x) => x[1]).join(", ")})`
  }
}

export class Bval {
  readonly type = "val"
  readonly value: Value

  constructor(name: string, kind: Kind) {
    this.value = Object.freeze({
      type: "bval",
      value: new ScriptValue(name, kind),
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
