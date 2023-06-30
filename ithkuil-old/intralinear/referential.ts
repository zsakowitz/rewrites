import { joinWithHyphens, joinWithSlashes } from "../helpers.js"
import { Referential } from "../parser/referential.js"
import type { Referrent } from "../types.js"
import { caseToSymbolMap } from "./case.js"
import { essenceMap, specificationMap } from "./maps.js"

export function referrentToIntralinear({
  effect,
  perspective,
  referrent,
}: Referrent) {
  return (
    referrent +
    (effect == "neutral" ? "/NEU" : effect == "beneficial" ? "/BEN" : "/DET") +
    (perspective == "agglomerative"
      ? "/AGG"
      : perspective == "nomic"
      ? "/NOM"
      : perspective == "abstract"
      ? "/ABS"
      : "")
  )
}

export function referentialToIntralinear(referential: Referential) {
  let referrents1 = referential.referrents1
    .map(referrentToIntralinear)
    .map((x) => x + "/" + caseToSymbolMap[referential.case1])

  let referrents2: string[] | undefined

  if (referential.case2) {
    if (referential.referrents2 && referential.referrents2.length) {
      referrents2 = referential.referrents2
        .map(referrentToIntralinear)
        .map((x) => x + "/" + caseToSymbolMap[referential.case2!])
    } else {
      referrents1 = referrents1.map(
        (x) => x + "/" + caseToSymbolMap[referential.case2!],
      )
    }
  } else if (referential.referrents2) {
    referrents2 = referential.referrents2.map(referrentToIntralinear)
  }

  let output = joinWithHyphens(
    referrents1
      .concat(referrents2 || [])
      .concat(
        joinWithSlashes([
          specificationMap[referential.specification || "basic"],
          essenceMap[referential.essence],
        ]),
      ),
  )
}
