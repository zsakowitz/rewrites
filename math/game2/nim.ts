export type NimValue = number

export function mex(args: NimValue[]): NimValue {
  for (let i = 0; ; i++) {
    if (args.includes(i)) {
      continue
    }
    return i
  }
}
