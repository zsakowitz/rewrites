import type { Perspective } from "../ca"
import { allPermutationsOf } from "../helpers/permutations"
import { isLegalWordInitialConsonantForm } from "../phonotactics"
import { referentialPerspectiveToIthkuil } from "./perspective"
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

  return output + referentialPerspectiveToIthkuil(perspective)
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
