import { affixToIthkuil, type Affix } from "../../affix"
import { applyStress, countVowelForms } from "../../helpers/stress"
import {
  extractAllConsonants,
  isLegalWordFinalConsonantForm,
  isLegalWordInitialConsonantForm,
} from "../../phonotactics"
import type { AffixualAdjunctScope } from "./scope"
import { affixualAdjunctScopeToIthkuil } from "./scope"

export * from "./scope"

export type AffixualAdjunct = {
  readonly affixes: [Affix, ...Affix[]]

  /** Scope of first affix. Also controls scope of 2nd and subsequent affixes when `scope2` is omitted. */
  readonly scope?: AffixualAdjunctScope

  /** Scope of 2nd and subsequent affixes. */
  readonly scope2?: AffixualAdjunctScope

  /**
   * `true` if adjunct applies only to concatenated stem.
   * `false` or `undefined` if adjunct applies to formative as a whole. */
  readonly appliesToConcatenatedStemOnly?: boolean
}

export function affixualAdjunctToIthkuil(adjunct: AffixualAdjunct) {
  if (adjunct.affixes.length == 1) {
    const affix = affixToIthkuil(adjunct.affixes[0], {
      reversed: false,
    }).defaultValue

    const scope = affixualAdjunctScopeToIthkuil(
      adjunct.scope ?? "V:DOM",
      "vs",
      (adjunct.appliesToConcatenatedStemOnly ?? false) &&
        isLegalWordFinalConsonantForm(extractAllConsonants(affix)),
    )

    if (adjunct.appliesToConcatenatedStemOnly) {
      const output = affix + scope

      if (countVowelForms(output) == 1) {
        return output
      } else {
        return applyStress(output, -1)
      }
    }

    return affix + scope
  }

  const rawAffix1 = affixToIthkuil(adjunct.affixes[0], {
    reversed: true,
  }).defaultValue

  const affix1 = isLegalWordInitialConsonantForm(
    extractAllConsonants(rawAffix1),
  )
    ? rawAffix1
    : "ë" + rawAffix1

  const cz = affixualAdjunctScopeToIthkuil(
    adjunct.scope ?? "V:DOM",
    "cz",
    false,
  )

  const main = adjunct.affixes
    .slice(1)
    .map((affix) => affixToIthkuil(affix, { reversed: false }))
    .reduce((a, b) => a + b.withPreviousText(a), affix1 + cz)

  const scope = adjunct.scope2
    ? affixualAdjunctScopeToIthkuil(adjunct.scope2, "vz", false)
    : "ai"

  const output = main + scope

  if (adjunct.appliesToConcatenatedStemOnly) {
    return applyStress(output, -1)
  }

  return output
}
