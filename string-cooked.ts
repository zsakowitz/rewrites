// A String.cooked function for use until the proposal is implemented.

export function cooked(
  strings: readonly string[],
  ...interpolations: readonly unknown[]
) {
  let output = strings[0] || ""

  for (let index = 1; index < strings.length; index++) {
    output += interpolations[index] + (strings[index] || "")
  }

  return output
}
