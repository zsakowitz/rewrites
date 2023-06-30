import { shuffle } from "../shuffle.js"

export const CONSONANT = /^[pbtdkgmnrfvszcjl]$/iu

export const CONSONANT_GROUP = /^[pbtdkgmnrfvszcjl]+$/iu

export type Consonant =
  | "p"
  | "b"
  | "t"
  | "d"
  | "k"
  | "g"
  | "m"
  | "n"
  | "r"
  | "f"
  | "v"
  | "s"
  | "z"
  | "c"
  | "j"
  | "l"

export const ALL_CONSONANTS = "pbtdkgmnrfvszcjl"
export const ALL_L = "rl"
export const ALL_NL = "pbtdkgmnfvszcj"

export const disallowedClusters = Object.freeze({
  p: ["p", "b"],
  b: ["p", "b"],
  t: ["t", "d"],
  d: ["t", "d"],
  k: ["k", "g"],
  g: ["k", "g"],
  m: ["m", "n"],
  n: ["m", "n"],
  r: ["r"],
  f: ["f", "v"],
  v: ["f", "v"],
  s: ["s", "z"],
  z: ["s", "z"],
  c: ["c", "j"],
  j: ["c", "j"],
  l: ["l"],
})

export function isValidConsonantCluster(cluster: string) {
  if (typeof cluster != "string") {
    return false
  }

  if (cluster.length == 0) {
    return false
  }

  if (!CONSONANT_GROUP.test(cluster)) {
    return false
  }

  for (let index = 0; index < cluster.length - 1; index++) {
    const first = cluster[index]! as Consonant
    const second = cluster[index + 1]! as Consonant

    if (disallowedClusters[first].includes(second)) {
      return false
    }
  }

  if (cluster.length == 1) {
    return true
  }

  if (cluster.length == 2) {
    return true
  }

  if (cluster.length == 3) {
    return "lr".includes(cluster[0]!) || "lr".includes(cluster[2]!)
  }

  return true
}

export function allInvalidDualConsonantClustersOrClusters() {
  const output: string[] = []

  for (const a of ALL_CONSONANTS) {
    for (const b of ALL_CONSONANTS) {
      if (disallowedClusters[a as Consonant].includes(b)) {
        output.push(a + b)
      }
    }
  }

  return output
}

export function allValidDualConsonantClusters() {
  const output: string[] = []

  for (const a of ALL_CONSONANTS) {
    for (const b of ALL_CONSONANTS) {
      if (!disallowedClusters[a as Consonant].includes(b)) {
        output.push(a + b)
      }
    }
  }

  return output
}

export function allValidTriConsonantClusters() {
  const output: string[] = []

  function add(cluster: string) {
    if (isValidConsonantCluster(cluster)) {
      output.push(cluster)
    }
  }

  for (const C of ALL_CONSONANTS) {
    for (const NL of ALL_NL) {
      for (const L of ALL_L) {
        add(C + NL + L)
        add(L + NL + C)
      }
    }
  }

  return output
}

{
  const clusters = shuffle(allValidDualConsonantClusters())

  console.log(JSON.stringify(clusters))
}
