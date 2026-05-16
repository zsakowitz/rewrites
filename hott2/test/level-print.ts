import { S } from "../../hott/util"
import type { Level } from "../src/decl"
import { L, M, Z } from "../src/level-cons"
import { printLevel } from "../src/level-print"
import { eq } from "./decl"

const l0: Level = Z()
eq(printLevel(l0), "0")

const l1: Level = S(l0)
eq(printLevel(l1), "1")

const l2: Level = S(l1)
eq(printLevel(l2), "2")

const l3: Level = S(l2)
eq(printLevel(l3), "3")

const lu: Level = L(0)
eq(printLevel(lu), "u")

const lv: Level = L(1)
eq(printLevel(lv), "v")

const lmaxuv: Level = M(lu, lv)
eq(printLevel(lmaxuv), "(max u v)")

const lmaxuv2: Level = S(S(lmaxuv))
eq(printLevel(lmaxuv2), "(max u v + 2)")

const lmax_maxuv2_u: Level = M(lmaxuv2, lu)
eq(printLevel(lmax_maxuv2_u), "(max (max u v + 2) u)")

const lmax_u_maxuv: Level = M(lu, lmaxuv)
eq(printLevel(lmax_u_maxuv), "(max u (max u v))")

const lh6: Level = L(6)
eq(printLevel(lh6), "#6")
