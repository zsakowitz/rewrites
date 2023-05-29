import { has } from "../helpers/has"
import { affixualAdjunctToIthkuil, type AffixualAdjunct } from "./affixual"
import {
  ALL_BIAS_ADJUNCTS,
  biasAdjunctToIthkuil,
  type BiasAdjunct,
} from "./bias"
import type { ModularAdjunct } from "./modular"
import { modularAdjunctToIthkuil } from "./modular"
import {
  ALL_PARSING_ADJUNCTS,
  parsingAdjunctToIthkuil,
  type ParsingAdjunct,
} from "./parsing"
import {
  ALL_REGISTER_ADJUNCTS,
  registerAdjunctToIthkuil,
  type RegisterAdjunct,
} from "./register"
import type { SuppletiveAdjunct } from "./suppletive"
import { suppletiveAdjunctToIthkuil } from "./suppletive"

export * from "./affixual"
export * from "./bias"
export * from "./modular"
export * from "./parsing"
export * from "./register"
export * from "./suppletive"

/** A general adjunct. */
export type Adjunct =
  | AffixualAdjunct
  | BiasAdjunct
  | ModularAdjunct
  | ParsingAdjunct
  | RegisterAdjunct
  | SuppletiveAdjunct

/**
 * Converts an adjunct into Ithkuil.
 * @param adjunct The adjunct to be converted.
 * @returns Romanized Ithkuilic text representing the adjunct.
 *
 * Note that for register adjuncts, this returns a string of the form "X ... Y",
 * "... X", or "...", depending on the adjunct type. For all other adjuncts,
 * this function returns exactly what you would expect.
 */
export function adjunctToIthkuil(adjunct: Adjunct): string {
  if (typeof adjunct == "string") {
    if (has(ALL_BIAS_ADJUNCTS, adjunct)) {
      return biasAdjunctToIthkuil(adjunct)
    }

    if (has(ALL_PARSING_ADJUNCTS, adjunct)) {
      return parsingAdjunctToIthkuil(adjunct)
    }

    if (has(ALL_REGISTER_ADJUNCTS, adjunct)) {
      const [initial, final] = registerAdjunctToIthkuil(adjunct)

      return (initial ? initial + " " : "") + "..." + (final ? " " + final : "")
    }

    throw new Error("Unrecognized adjunct: '" + adjunct + "'.")
  }

  if ("affixes" in adjunct && adjunct.affixes) {
    return affixualAdjunctToIthkuil(adjunct)
  }

  if ("vn1" in adjunct && adjunct.vn1) {
    return modularAdjunctToIthkuil(adjunct)
  }

  if ("type" in adjunct && adjunct.type) {
    return suppletiveAdjunctToIthkuil(adjunct)
  }

  throw new Error("Unrecognized adjunct: '" + adjunct + "'.", {
    cause: adjunct,
  })
}
