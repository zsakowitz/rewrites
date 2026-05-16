import type { Level } from "../src/decl"
import { printLevel } from "../src/print-level"
import { eq } from "./decl"

const l0: Level = { k: "zero", v: null }
eq(printLevel(l0), "0")

const l1: Level = { k: "succ", v: l0 }
eq(printLevel(l1), "1")

const l2: Level = { k: "succ", v: l1 }
eq(printLevel(l2), "2")

const l3: Level = { k: "succ", v: l2 }
eq(printLevel(l3), "3")

const lu: Level = { k: "var", v: 0 }
eq(printLevel(lu), "u")

const lv: Level = { k: "var", v: 1 }
eq(printLevel(lv), "v")

const lmaxuv: Level = { k: "max", v: [lu, lv] }
eq(printLevel(lmaxuv), "max u v")

const lmaxuv2: Level = { k: "succ", v: { k: "succ", v: lmaxuv } }
eq(printLevel(lmaxuv2), "max u v + 2")

const lmax_maxuv2_u: Level = { k: "max", v: [lmaxuv2, lu] }
eq(printLevel(lmax_maxuv2_u), "max (max u v + 2) u")

const lmax_u_maxuv: Level = { k: "max", v: [lu, lmaxuv] }
eq(printLevel(lmax_u_maxuv), "max u (max u v)")

const lh6: Level = { k: "var", v: 6 }
eq(printLevel(lh6), "#6")
