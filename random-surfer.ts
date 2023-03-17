// Randomly surfs web pages to discover the probability of finding certain pages
// in a network.

import { randomItem } from "./random-item"

export class Page {
  readonly name: string
  readonly links: Page[] = []

  constructor(name: string) {
    this.name = name
  }

  linkTo(...others: Page[]) {
    for (const other of others) {
      if (!this.links.includes(other)) {
        this.links.push(other)
      }
    }
  }

  randomLink(): Page | undefined {
    return randomItem(this.links)
  }
}

const a = new Page("A")
const b = new Page("B")
const c = new Page("C")
const d = new Page("D")
const e = new Page("E")

a.linkTo(b, c)
b.linkTo(d, e)
c.linkTo(a, d, c)
e.linkTo(a, c, b)
d.linkTo(b)

export function surf(pages: readonly [Page, ...Page[]], iterations: number) {
  let current = randomItem(pages)

  for (; iterations > 0; iterations--) {
    const next = current.randomLink()

    if (next) {
      current = next
    } else {
      current = randomItem(pages)
    }
  }

  return current
}

export function repeatedlySurf(
  pages: readonly [Page, ...Page[]],
  iterations: number,
  count: number
) {
  const output: Record<string, number> = Object.create(null)

  for (; count > 0; count--) {
    const final = surf(pages, iterations)
    output[final.name] = (output[final.name] ?? 0) + 1
  }

  return output
}

export function alternateSurf(start: Page, iterations: number) {
  const scores: Record<string, number> = Object.create(null)

  let current = start

  for (; iterations > 0; iterations--) {
    const next = current.randomLink()

    if (next) {
      current = next
    } else {
      throw new Error("All pages must have at least one outgoing link.")
    }

    scores[current.name] = (scores[current.name] ?? 0) + 1
  }

  return Object.fromEntries(
    Object.entries(scores).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  )
}

export function normalize(scores: Record<string, number>, size: number) {
  for (const key in scores) {
    scores[key] = Math.round(scores[key]! / size)
  }

  return scores
}
