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

export type Item =
  | { type: "val"; value: Value }
  | { type: "fn"; args: string[]; value: Value }
  | { type: "bval"; kind: Kind }
  | { type: "bfn"; kind: Signature[] }

export type MutableScript = { [name: string]: Item | undefined }

export type Script = { readonly [name: string]: Item | undefined }

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

  // addKind(name: string, kind: Kind) {
  //   this.#add(name, kind)
  // }

  // addSignature(name: string, signature: Signature) {
  //   this.#add(name, signature)
  // }

  // #add(name: string, kind: Kind | Signature) {
  //   let usages = this.usages[name]
  //   if (!usages) {
  //     usages = this.usages[name] = []
  //   }

  //   if (usages.some((x) => x.str == kind.str)) {
  //     return
  //   }

  //   usages.push(kind)
  // }
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

export type ScriptValue = { script: string; kind: Kind }
export type ScriptFn = { call(args: string[]): ScriptValue; kind: Kind }

export function valueToScript(
  value: Value,
  global: Script,
  local: MutableScript,
  tracker: UsageTracker,
  names: NameHasher,
): ScriptValue {
  switch (value.type) {
    case "var": {
      const v = local[value.name] ?? global[value.name]
      if (v == null) {
        throw new MissingError(value.name)
      }

      return itemToScript(v, global, local, tracker, names)
    }
    case "bind": {
      const prev = local[value.name]
      local[value.name] = { type: "val", value: value.bound }
      const data = valueToScript(value.contents, global, local, tracker, names)
      local[value.name] = prev
      return data
    }
    case "fn": {
      if (local[value.name] != null) {
        throw new LocalFunctionsNotSupportedError(value.name)
      }

      const g = global[value.name]
      if (g == null) {
        throw new MissingError(value.name)
      }

      const args = value.args.map((value) =>
        valueToScript(value, global, local, tracker, names),
      )

      const data = fnToScript(
        g,
        args.map((x) => x.kind),
        global,
        local,
        tracker,
        names,
      )

      return data.call(args.map((x) => x.script))
    }
  }
}

export function itemToScript(
  item: Item,
  global: Script,
  local: MutableScript,
  tracker: UsageTracker,
  names: NameHasher,
): ScriptValue {}

export function fnToScript(
  item: Item,
  args: Kind[],
  global: Script,
  local: MutableScript,
  tracker: UsageTracker,
  names: NameHasher,
): ScriptFn {
  // MUST RECORD FUNCTION SOURCE IN `tracker`
}
