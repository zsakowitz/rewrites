import type { Pos } from "./pos"

export class ScriptError extends Error {
  constructor(
    readonly reason: string,
    readonly pos: Pos,
  ) {
    super(`${reason} @ ${pos}`)
  }
}

export function issue(reason: string, pos: Pos): never {
  throw new ScriptError(reason, pos)
}

export function _try<T>(f: () => T): T {
  try {
    return f()
  } catch (e) {
    if (e instanceof ScriptError) {
      throw e.message
    } else {
      throw e
    }
  }
}
