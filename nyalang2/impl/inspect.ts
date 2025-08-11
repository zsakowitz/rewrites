export const INSPECT = Symbol.for("nodejs.util.inspect.custom")

export function indent(x: string) {
  return x.replace(/\n/g, "\n  ")
}
