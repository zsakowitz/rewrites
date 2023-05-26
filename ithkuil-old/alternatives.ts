export const AlternativeType = Symbol()

export type WithWYAlternative = readonly [
  defaultAffix: string,
  affixWhenWOrY: string,
] & {
  [AlternativeType]: "wy"
}

export function asWYAlternative(arr: readonly [string, string]) {
  ;(arr as WithWYAlternative)[AlternativeType] = "wy"
  return arr as WithWYAlternative
}

export type WithKPTAlternative = readonly [
  defaultAffix: string,
  affixWhenAfterKPT: string,
] & {
  [AlternativeType]: "kpt"
}

export function asKPTAlternative(arr: readonly [string, string]) {
  ;(arr as WithKPTAlternative)[AlternativeType] = "kpt"
  return arr as WithKPTAlternative
}

export type WithStandaloneAlternative = readonly [
  defaultAffix: string,
  standaloneAffix: string,
] & {
  [AlternativeType]: "standalone"
}

export function asStandaloneAlternative(arr: readonly [string, string]) {
  ;(arr as WithStandaloneAlternative)[AlternativeType] = "standalone"
  return arr as WithStandaloneAlternative
}

export type WithUniplexAlternative = readonly [
  defaultAffix: string,
  uniplexAffix: string,
] & {
  [AlternativeType]: "uniplex"
}

export function asUniplexAlternative(arr: readonly [string, string]) {
  ;(arr as WithUniplexAlternative)[AlternativeType] = "uniplex"
  return arr as WithUniplexAlternative
}

export function pickUniplexAlternative(
  options: string | WithUniplexAlternative,
  uniplex: boolean,
) {
  if (typeof options == "string") {
    return options
  }

  if (uniplex) {
    return options[1]
  } else {
    return options[0]
  }
}
