import { any, anyText, end, seq, start } from "./index.js"
import { C, CG, CNG, H, V } from "./core.js"

export const ccNoShortcut = anyText("h", "hw")

export const ccWithShortcut = anyText("h", "hw")

export const simpleFormative = seq(
  start,

  seq(
    // Slot I: Cc
    ccNoShortcut.optional().asGroup(),

    // Slot II: Vv
    V.asGroup(),
  ).optional(),

  // Slot III: Cr
  C.asGroup(),

  // Slot IV: Vr
  V.asGroup(),

  // Slots V and VI
  any(
    seq(
      // Slot V: (CsVx...)
      seq(CNG, V).oneOrMore().asGroup(),

      // Slot VI: Ca
      CG.asGroup(),
    ),

    // Slot VI: Ca
    CNG.asGroup(),
  ),

  // Slot VII: (VxCs...)
  seq(V, CNG).zeroOrMore().asGroup(),

  // Slot VIII: (VnCn)
  seq(V, H).optional().asGroup(),

  // Slot IX: (Vc/Vf/Vk)
  V.optional().asGroup(),

  end,
).compile()

console.log(simpleFormative)
