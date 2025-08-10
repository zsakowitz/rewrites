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

if (typeof process == "object") {
  process.on("uncaughtException", (error) => {
    if (error instanceof ScriptError) {
      console.error(error.message)
    }
  })
}
