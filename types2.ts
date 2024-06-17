export class Kind {
  readonly type = "kind"
  readonly str: string

  constructor(readonly kind: "float" | "floatlist" | "bool") {
    this.str = this.kind
    Object.freeze(this)
  }

  toString() {
    return this.str
  }

  toGlsl() {
    return {
      float: "float",
      floatlist: "float[]",
      bool: "bool",
    }[this.kind]
  }
}

export class Signature {
  readonly str: string

  constructor(readonly args: Kind[], readonly output: Kind) {
    this.str = `(${this.args.join(",")}->${this.output})`
    Object.freeze(this)
  }

  toString() {
    return this.str
  }
}

export type Value =
  | { type: "var"; name: string }
  | { type: "bind"; name: string; bound: Value; contents: Value }
  | { type: "fn"; name: string; args: Value[] }
  | { type: "bval"; value: ScriptValue }

export type Item =
  | { type: "val"; value: Value }
  | { type: "fn"; args: string[]; value: Value }
  | { type: "bfn"; call: Fn }

export type Locals = { [name: string]: ScriptValue | undefined }

export type GlobalScript = { readonly [name: string]: Item | undefined }

export type Fn = (args: ScriptValue[]) => ScriptValue

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

export class UsageTracker {
  readonly fns: { [fn: string]: string } = Object.create(null)

  constructor() {
    Object.freeze(this)
  }
}

export class NameHasher {
  static random() {
    return "x_custom_" + Math.random().toString().slice(2)
  }

  readonly names: { [itemName: string]: { [kind: string]: string } } =
    Object.create(null)

  constructor() {
    Object.freeze(this)
  }

  get(name: string, kind: Kind | Signature) {
    const kinds = (this.names[name] ??= Object.create(null))
    return (kinds[kind.str] ??= NameHasher.random())
  }
}

export class ScriptValue {
  constructor(readonly script: string, readonly kind: Kind) {
    Object.freeze(this)
  }

  #_ = 2
}

export class Scriptifier {
  constructor(
    readonly globals: GlobalScript = Object.create(null),
    readonly locals: Locals = Object.create(null),
    readonly tracker = new UsageTracker(),
    readonly names = new NameHasher(),
    readonly implicitFn: Fn = () => {
      throw new Error(
        "This calculator does not support implicit multiplication.",
      )
    },
    readonly pointFn: Fn = () => {
      throw new Error("This calculator does not support points.")
    },
  ) {
    Object.freeze(this)
  }

  valueToScript(value: Value): ScriptValue {
    const { locals, globals } = this

    switch (value.type) {
      case "bval":
        return value.value

      case "var": {
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
    // MUST RECORD FUNCTION SOURCE IN `tracker`
    switch (item.type) {
      case "val":
        throw new Error("TODO: implement implicit multiplication")

      case "fn": {
        if (item.args.length != args.length) {
          throw new Error(`${name} takes ${item.args.length} parameters.`)
        }

        const argNames: string[] = []
        const old = Object.create(null)
        for (let index = 0; index < item.args.length; index++) {
          const argName: string = item.args[index]!
          if (argName in old) {
            throw new Error(
              `${name} cannot have multiple parameters named ${argName}.`,
            )
          }
          const value = args[index]!
          old[argName] = this.locals[argName]
          const hashedName = this.names.get(argName, value.kind)
          argNames.push(hashedName)
          this.locals[argName] = new ScriptValue(hashedName, value.kind)
        }

        const retval = this.valueToScript(item.value)

        for (const name in old) {
          this.locals[name] = old[name]
        }

        const fnSignature = new Signature(
          args.map((x) => x.kind),
          retval.kind,
        )

        const fnName = this.names.get(name, fnSignature)

        this.tracker.fns[
          fnName
        ] = `${retval.kind.toGlsl()} ${fnName}() { return ${retval.script}; }`

        return new ScriptValue(
          `(${fnName}(${args.map((x) => x.script)}))`,
          retval.kind,
        )
      }

      case "bfn": {
        return item.call(args)
      }
    }
  }
}

const basic = new Scriptifier({
  pi: {
    type: "val",
    value: {
      type: "bval",
      value: new ScriptValue("3.14159", new Kind("float")),
    },
  },
  true: {
    type: "val",
    value: {
      type: "bval",
      value: new ScriptValue("true", new Kind("bool")),
    },
  },
  false: {
    type: "val",
    value: {
      type: "bval",
      value: new ScriptValue("false", new Kind("bool")),
    },
  },
})
