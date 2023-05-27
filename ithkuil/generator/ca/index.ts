import type { Expand } from "../../expand"
import { affiliationToIthkuil, type Affiliation } from "./affiliation"
import { configurationToIthkuil, type Configuration } from "./configuration"
import type { Essence } from "./essence"
import { extensionToIthkuil, type Extension } from "./extension"
import type { Perspective } from "./perspective"
import { perspectiveAndEssenceToIthkuil } from "./perspective-and-essence"

export * from "./affiliation"
export * from "./configuration"
export * from "./essence"
export * from "./extension"
export * from "./geminate"
export * from "./perspective"
export * from "./perspective-and-essence"

export type CA = {
  readonly affiliation: Affiliation
  readonly configuration: Configuration
  readonly extension: Extension
  readonly perspective: Perspective
  readonly essence: Essence
}

export type PartialCA = Expand<Partial<CA>>

export function makeCAAllomorphicSubstitutions(ca: string) {
  return ca
    .replace(/pp/g, "mp")
    .replace(/tt/g, "nt")
    .replace(/kk/g, "nk")
    .replace(/ll/g, "pļ")
    .replace(/pb/g, "mb")
    .replace(/kg/g, "ng")
    .replace(/çy/g, "nd")
    .replace(/rr/g, "ns")
    .replace(/rř/g, "nš")
    .replace(/řr/g, "ňs")
    .replace(/řř/g, "ňš")
    .replace(/(.)gm/g, "$1x")
    .replace(/(.)gn/g, "$1ň")
    .replace(/nň/g, "ňn")
    .replace(/(.)çx/g, "$1xw")
    .replace(/(.)bm/g, "$1v")
    .replace(/(.)bn/g, "$1ḑ")
    .replace(/fv/g, "vw")
    .replace(/tḑ/g, "ḑy")
}

export function caToIthkuil(CA: PartialCA) {
  const ca = fillInDefaultCAValues(CA)

  const configuration = configurationToIthkuil(ca.configuration)

  const extension = extensionToIthkuil(ca.extension, ca.configuration == "UPX")

  const affiliation = affiliationToIthkuil(
    ca.affiliation,

    configuration == "" &&
      extension == "" &&
      ca.perspective == "M" &&
      ca.essence == "NRM",
  )

  const perspectiveAndEssence = perspectiveAndEssenceToIthkuil(
    ca.perspective,
    ca.essence,
    affiliation == "" && configuration == "" && extension == "",
    !!(affiliation + configuration + extension).match(/[kpt]$/),
  )

  const core = affiliation + configuration + extension + perspectiveAndEssence

  return makeCAAllomorphicSubstitutions(core)
}

export function fillInDefaultCAValues(ca: PartialCA): CA {
  return {
    affiliation: "CSL",
    configuration: "UPX",
    extension: "DEL",
    perspective: "M",
    essence: "NRM",
    ...ca,
  }
}
