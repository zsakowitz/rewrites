import * as Z from "../../parsers/parser-5"
import {
  Effect,
  Essence,
  Perspective,
  Referrent,
  ReferrentType,
  Specification,
} from "../types"
import { Affix, StandardAffix } from "./affix"
import { Case } from "./case"
import { normalized } from "./helpers"
import { makeParserFromMap } from "./make-parser-from-map"

export const ReferentialCode = makeParserFromMap<{
  referrent: ReferrentType
  effect: Effect
}>({
  l: { referrent: "1m", effect: "neutral" },
  r: { referrent: "1m", effect: "beneficial" },
  ř: { referrent: "1m", effect: "detrimental" },
  s: { referrent: "2m", effect: "neutral" },
  š: { referrent: "2m", effect: "beneficial" },
  ž: { referrent: "2m", effect: "detrimental" },
  n: { referrent: "2p", effect: "neutral" },
  t: { referrent: "2p", effect: "beneficial" },
  d: { referrent: "2p", effect: "detrimental" },
  m: { referrent: "ma", effect: "neutral" },
  p: { referrent: "ma", effect: "beneficial" },
  b: { referrent: "ma", effect: "detrimental" },
  ň: { referrent: "pa", effect: "neutral" },
  k: { referrent: "pa", effect: "beneficial" },
  g: { referrent: "pa", effect: "detrimental" },
  z: { referrent: "mi", effect: "neutral" },
  ţ: { referrent: "mi", effect: "beneficial" },
  ḑ: { referrent: "mi", effect: "detrimental" },
  ẓ: { referrent: "pi", effect: "neutral" },
  f: { referrent: "pi", effect: "beneficial" },
  v: { referrent: "pi", effect: "detrimental" },
  c: { referrent: "Mx", effect: "neutral" },
  č: { referrent: "Mx", effect: "beneficial" },
  j: { referrent: "Mx", effect: "detrimental" },
  th: { referrent: "Rdp", effect: "neutral" },
  ph: { referrent: "Rdp", effect: "beneficial" },
  kh: { referrent: "Rdp", effect: "detrimental" },

  ll: { referrent: "Obv", effect: "neutral" },
  rr: { referrent: "Obv", effect: "beneficial" },
  řř: { referrent: "Obv", effect: "detrimental" },
  mm: { referrent: "PVS", effect: "neutral" },
  nn: { referrent: "PVS", effect: "beneficial" },
  ňň: { referrent: "PVS", effect: "detrimental" },
} as const)

export const ReferentialFormativeCode = makeParserFromMap({
  l: { type: "1m", effect: "neutral" },
  r: { type: "1m", effect: "beneficial" },
  ř: { type: "1m", effect: "detrimental" },
  s: { type: "2m", effect: "neutral" },
  š: { type: "2m", effect: "beneficial" },
  ž: { type: "2m", effect: "detrimental" },
  n: { type: "2p", effect: "neutral" },
  t: { type: "2p", effect: "beneficial" },
  d: { type: "2p", effect: "detrimental" },
  m: { type: "ma", effect: "neutral" },
  p: { type: "ma", effect: "beneficial" },
  b: { type: "ma", effect: "detrimental" },
  ň: { type: "pa", effect: "neutral" },
  k: { type: "pa", effect: "beneficial" },
  g: { type: "pa", effect: "detrimental" },
  z: { type: "mi", effect: "neutral" },
  ţ: { type: "mi", effect: "beneficial" },
  ḑ: { type: "mi", effect: "detrimental" },
  ẓ: { type: "pi", effect: "neutral" },
  f: { type: "pi", effect: "beneficial" },
  v: { type: "pi", effect: "detrimental" },
  c: { type: "Mx", effect: "neutral" },
  č: { type: "Mx", effect: "beneficial" },
  j: { type: "Mx", effect: "detrimental" },
  th: { type: "Rdp", effect: "neutral" },
  ph: { type: "Rdp", effect: "beneficial" },
  kh: { type: "Rdp", effect: "detrimental" },

  lç: { type: "Obv", effect: "neutral" },
  rç: { type: "Obv", effect: "beneficial" },
  řç: { type: "Obv", effect: "detrimental" },
  mç: { type: "PVS", effect: "neutral" },
  nç: { type: "PVS", effect: "beneficial" },
  ňç: { type: "PVS", effect: "detrimental" },
} as const)

export const ReferentialPerspectiveCode = makeParserFromMap<Perspective>({
  ļ: "agglomerative",
  tļ: "agglomerative",
  ç: "nomic",
  x: "nomic",
  w: "abstract",
  y: "abstract",
} as const)

export const ReferentialWithPerspective = Z.seq(
  ReferentialPerspectiveCode.optionalWith("monadic" as const),
  ReferentialCode,
).map<Referrent>(([perspective, referrent]) => ({ ...referrent, perspective }))

export const ReferentialWithPerspectiveAndËBefore = Z.seq(
  Z.text("ë").optional(),
  ReferentialWithPerspective,
).map((value) => value[1])

export const ReferentialWithPerspectiveAndËAfter = Z.seq(
  Z.text("ë").optional(),
  ReferentialWithPerspective,
).map((value) => value[1])

export const ReferentialSpecification = makeParserFromMap<Specification>({
  x: "basic",
  xt: "contential",
  xp: "constitutive",
  xx: "objective",
})

export type Referential = {
  case1: Case
  referrents1: [Referrent, ...Referrent[]]

  case2?: Case
  referrents2?: Referrent[]

  specification?: Specification
  affixes?: Affix[]

  essence: Essence
}

export const RawReferential = Z.seq(
  ReferentialWithPerspectiveAndËBefore.many1(),
  Case,
  Z.any(
    Z.seq(
      Z.regex(/^[wy]/i),
      Case,
      ReferentialWithPerspectiveAndËAfter.many(),
    ).map(([separator, case2, referrents2]) => ({
      separator: separator[0] == "w" ? ("w" as const) : ("y" as const),
      case2,
      referrents2,
    })),
    Z.seq(
      ReferentialSpecification,
      StandardAffix.many(),
      Z.any(
        Z.text("a").void(),
        Z.text("üa").value<Case>("thematic"),
        Case,
      ).optional(),
    ).map(([specification, affixes, case2]) => ({
      specification,
      case2,
      affixes,
    })),
  ).optional(),
).map<Referential>(([referrents1, case1, extra]) => ({
  ...extra,
  case1,
  referrents1,
  essence: "normal",
}))

export const Referential = normalized(RawReferential).map<Referential>(
  ({ stress, value }) => ({
    ...value,
    essence: stress.asReferentialEssence(),
  }),
)
