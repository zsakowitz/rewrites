export type Kind = "float" | "float_list"

export type Signature = { args: Kind[]; out: Kind }

export type Value =
  | { type: "builtin"; kind: Kind }
  | { type: "name"; name: string }
  | { type: "call"; name: string; args: Value[] }

export type Definition =
  | { type: "bvar"; kind: Kind }
  | { type: "bfn"; kind: Signature[] }
  | { type: "uvar"; value: Value }
  | { type: "ufn"; args: string[]; value: Value }

export type Script = { [x: string]: Definition }

export interface ToScript {
  kind: Kind
}

export class ToScriptError extends Error {}

export class MissingVariableError extends ToScriptError {
  constructor(reason: string, readonly missing: string) {
    super(reason)
  }
}

function addCyclicUsage(script: Script, name: string): Script {
  return {
    ...script,
    get [name](): never {
      throw new ToScriptError(`Cyclic variable access of '${name}' detected.`)
    },
  }
}

export function defnToScript(
  name: string,
  defn: Definition,
  script: Script,
): ToScript {
  const inner = addCyclicUsage(script, name)

  switch (defn.type) {
    case "bvar":
      return { kind: defn.kind }
    case "bfn":
      throw new ToScriptError(`'${name}' is a function. Try using parentheses.`)
    case "uvar":
      return valueToScript(defn.value, inner)
    case "ufn":
      throw new ToScriptError(`'${name}' is a function. Try using parentheses.`)
  }
}

export function callToScript(
  name: string,
  defn: Definition,
  args: Value[],
  script: Script,
): ToScript {
  const inner = addCyclicUsage(script, name)

  switch (defn.type) {
    case "bvar":
    case "bfn":
    case "uvar":
    case "ufn":
  }
}

export function valueToScript(value: Value, script: Script): ToScript {
  switch (value.type) {
    case "builtin":
      return { kind: value.kind }
    case "name": {
      const val = script[value.name]

      if (!val) {
        throw new MissingVariableError(
          `'${value.name}' does not exist.`,
          value.name,
        )
      }

      return defnToScript(value.name, val, script)
    }
    case "call": {
      const val = script[value.name]
    }
  }
}
