import type { Perspective } from "../ca"
import { allPermutationsOf } from "../helpers/permutations"
import {
  isLegalConsonantForm,
  isLegalWordInitialConsonantForm,
} from "../phonotactics"
import {
  referentialPerspectiveToIthkuil,
  referentialPerspectiveToIthkuilAlt,
} from "./perspective"
import { referrentToIthkuil, type Referrent } from "./referrent"

export type ReferrentList = readonly [Referrent, ...Referrent[]]

function assembleReferrentCluster(
  referrents: ReferrentList,
  perspective: Perspective,
) {
  const text = referrents.map((referrent) =>
    referrentToIthkuil(referrent, false),
  )

  let output = ""

  let index = 0

  for (; index < text.length; index++) {
    if (isLegalWordInitialConsonantForm(output + text[index])) {
      output += text[index]
    } else {
      output = "ë" + output + text.slice(index)
      break
    }
  }

  const persp = referentialPerspectiveToIthkuil(perspective)
  const persp2 = referentialPerspectiveToIthkuilAlt(perspective)

  if (output.startsWith("ë")) {
    if (isLegalConsonantForm(output.slice(1) + persp)) {
      return output + persp
    }

    if (isLegalConsonantForm(persp + output.slice(1))) {
      return "ë" + persp + output.slice(1)
    }

    // The following may be phonotactically invalid.
    return output + persp
  }

  if (isLegalWordInitialConsonantForm(output + persp)) {
    return output + persp
  }

  if (isLegalWordInitialConsonantForm(persp + output)) {
    return persp + output
  }

  if (isLegalWordInitialConsonantForm(output + persp2)) {
    return output + persp2
  }

  if (isLegalWordInitialConsonantForm(persp2 + output)) {
    return persp2 + output
  }

  // The following may be phonotactically invalid.
  return "ë" + output + persp
}

export function referrentClusterToIthkuil(
  referrents: ReferrentList,
  perspective: Perspective,
): string {
  const all = allPermutationsOf(referrents)
    .map((referrentList) =>
      assembleReferrentCluster(referrentList, perspective),
    )
    .sort((a, b) => (a.length < b.length ? -1 : a.length > b.length ? 1 : 0))

  const valid = all.filter(
    (text) => text.startsWith("ë") || isLegalWordInitialConsonantForm(text),
  )

  if (valid.length > 0) {
    return valid[0]!
  } else {
    return all[0]!
  }
}
