import type { Mood } from "@zsnout/ithkuil"
import { freezeNullPrototype } from "../null-proto-frozen.js"

const CN_TO_MOOD = freezeNullPrototype({
  h: "FAC",
  hl: "SUB",
  hr: "ASM",
  hm: "SPC",
  hn: "COU",
  hň: "HYP",
})

const CN_TO_ASPECTUAL_MOOD = freezeNullPrototype({
  w: "FAC",
  y: "FAC",
  hw: "SUB",
  hrw: "ASM",
  hmw: "SPC",
  hnw: "COU",
  hňw: "HYP",
})

export function parseMood(cn: string): [mood: Mood, isAspectual: boolean] {
  if (cn in CN_TO_MOOD) {
    return [CN_TO_MOOD[cn as keyof typeof CN_TO_MOOD], false]
  }

  if (cn in CN_TO_ASPECTUAL_MOOD) {
    return [CN_TO_ASPECTUAL_MOOD[cn as keyof typeof CN_TO_ASPECTUAL_MOOD], true]
  }

  throw new Error("Invalid Cn: '" + cn + "'.")
}
