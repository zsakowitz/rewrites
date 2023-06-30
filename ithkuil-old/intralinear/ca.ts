import { joinWithSlashes } from "../helpers.js"
import type { CA } from "../types.js"
import {
  affiliationMap,
  extensionMap,
  nonEmptyAffiliationMap,
  nonEmptyExtensionMap,
} from "./maps.js"

export function caToIntralinear(ca: CA, showDefaults: boolean) {
  if (showDefaults) {
    return joinWithSlashes([
      nonEmptyAffiliationMap[ca.affiliation],

      ca.configuration.separability
        ? (ca.configuration.plexity == "duplex" ? "D" : "M") +
          ca.configuration.similarity[0]!.toUpperCase() +
          ca.configuration.separability[0]!.toUpperCase()
        : ca.configuration.plexity == "uniplex"
        ? "UPX"
        : "DPX",

      nonEmptyExtensionMap[ca.extension],

      ca.perspective[0]!.toUpperCase(),

      ca.essence == "normal" ? "NRM" : "RPV",
    ])
  }

  return (
    joinWithSlashes([
      affiliationMap[ca.affiliation],

      ca.configuration.separability
        ? (ca.configuration.plexity == "duplex" ? "D" : "M") +
          ca.configuration.similarity[0]!.toUpperCase() +
          ca.configuration.separability[0]!.toUpperCase()
        : ca.configuration.plexity == "uniplex"
        ? ""
        : "DPX",

      extensionMap[ca.extension],

      ca.perspective == "monadic" ? "" : ca.perspective[0]!.toUpperCase(),

      ca.essence == "normal" ? "" : "RPV",
    ]) || "[default CA]"
  )
}
