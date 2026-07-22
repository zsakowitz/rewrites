import * as Z from "../../parsers/parser-5.js"
import type { CA } from "../types.js"
import { CAComplex } from "./ca.js"
import { makeParserFromMap } from "./make-parser-from-map.js"

export type AffixDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0

export type AffixType = 1 | 2 | 3 | 4

export const vowelForm1ToDegreeMap = makeParserFromMap<AffixDegree>({
    a: 1,
    ä: 2,
    e: 3,
    i: 4,
    ëi: 5,
    ö: 6,
    o: 7,
    ü: 8,
    u: 9,
    ae: 0,
}).map((degree) => ({ degree, type: 1 as const }))

export const vowelForm2ToDegreeMap = makeParserFromMap<AffixDegree>({
    ai: 1,
    au: 2,
    ei: 3,
    eu: 4,
    ëu: 5,
    ou: 6,
    oi: 7,
    iu: 8,
    ui: 9,
    ea: 0,
}).map((degree) => ({ degree, type: 2 as const }))

export const vowelForm3ToDegreeMap = makeParserFromMap<AffixDegree>({
    "ia/uä": 1,
    "ie/uë": 2,
    "io/üä": 3,
    "iö/üë": 4,
    eë: 5,
    "uö/öë": 6,
    "uo/öä": 7,
    "ue/ië": 8,
    "ua/iä": 9,
    üo: 0,
}).map((degree) => ({ degree, type: 3 as const }))

export const AffixVowelForm: Z.Parser<{
    degree: AffixDegree
    type: AffixType
}> = Z.any(vowelForm1ToDegreeMap, vowelForm2ToDegreeMap, vowelForm3ToDegreeMap)

export const AffixConsonantForm = Z.regex(/^[^aeiouäëöüáéíóúâêôû']+/i).map(
    (result) => result[0],
)

export type Affix =
    | {
          category: "standard"
          name: string
          degree: AffixDegree
          type: AffixType
      }
    | {
          category: "ca"
          ca: CA
      }

export const StandardAffix = Z.any(
    Z.seq(AffixVowelForm, AffixConsonantForm).map<Affix>(
        ([vowelForm, name]) => ({
            ...vowelForm,
            category: "standard",
            name,
        }),
    ),
    Z.seq(Z.text("üö"), CAComplex).map<Affix>(([, ca]) => ({
        category: "ca",
        ca,
    })),
)
