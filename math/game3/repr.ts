import type { Num } from "."

function repr(num: Num): { type: "num"; val: number; exp: number } | null {
  // Integers
  if (num.lhs.length == 0 && num.rhs.length == 0) {
    return { type: "num", val: 0, exp: 0 }
  }
  if (num.lhs.length == 1 && num.rhs.length == 0) {
    const lhs = repr(num.lhs[0]!)
    if (lhs?.type == "num" && lhs.exp == 0) {
      return { type: "num", val: lhs.val + 1, exp: 0 }
    }
  }
  if (num.lhs.length == 0 && num.rhs.length == 1) {
    const rhs = repr(num.rhs[0]!)
    if (rhs?.type == "num" && rhs.exp == 0) {
      return { type: "num", val: rhs.val - 1, exp: 0 }
    }
  }

  // Dyadic rationals
  if (num.lhs.length == 1 && num.rhs.length == 1) {
    const lhs = repr(num.lhs[0]!)
    const rhs = repr(num.rhs[0]!)
    if (
      lhs?.type == "num"
      && rhs?.type == "num"
      && lhs.val < rhs.val
      && lhs.exp == rhs.exp
    ) {
      return { type: "num", val: lhs.val + rhs.val, exp: lhs.exp + 1 }
    }
  }

  return null
}

function inner(num: Num): {
  val: string
  maxUsedBars: number
  needsBrackets: boolean
} {
  const r = repr(num)
  if (r?.type == "num") {
    if (r.exp == 0) {
      return { val: "" + r.val, maxUsedBars: 0, needsBrackets: false }
    }
    return {
      val: r.val + "/" + 2 ** r.exp,
      maxUsedBars: 0,
      needsBrackets: false,
    }
  }

  if (num.lhs.length <= 1 && num.rhs.length <= 1) {
    const vl = num.lhs[0] && inner(num.lhs[0])
    const vr = num.rhs[0] && inner(num.rhs[0])
    let bars = 1
    let lhs =
      vl ?
        vl.val.endsWith("|") ?
          `{${vl.val}}`
        : ((bars = Math.max(bars, vl.maxUsedBars + 1)), vl.val)
      : ""
    let rhs =
      vr ?
        vr.val.startsWith("|") ?
          `{${vr.val}}`
        : ((bars = Math.max(bars, vr.maxUsedBars + 1)), vr.val)
      : ""
    if (rhs.startsWith("|")) rhs = " " + rhs
    return {
      val: lhs + "|".repeat(bars) + rhs,
      maxUsedBars: bars,
      needsBrackets: true,
    }
  }

  const val =
    num.lhs
      .map((v) => {
        const s = inner(v)
        return s.needsBrackets ? `{${s}}` : s
      })
      .join(",")
    + "|"
    + num.rhs
      .map((v) => {
        const s = inner(v)
        return s.needsBrackets ? `{${s}}` : s
      })
      .join(",")

  return { val, maxUsedBars: 0, needsBrackets: false }
}

export function toString(num: Num) {
  const { val, needsBrackets } = inner(num)
  if (needsBrackets) {
    return `{${val}}`
  } else {
    return val
  }
}
