import { Graph } from "."
import { mex, type Nimber } from "../game2/nim"
import { createForceGraph } from "./force"

class FruitDeliveryGraph extends Graph<0 | 1 | void, void> {
  isWinningPosition() {
    return this.vl.some((vertex) => {
      if (vertex.data !== undefined) {
        return false
      }

      const canPlay0 = !vertex.edges.some(
        (edge) => edge.src.data === 0 || edge.dst.data === 0,
      )

      const canPlay1 = !vertex.edges.some(
        (edge) => edge.src.data === 1 || edge.dst.data === 1,
      )

      if (canPlay0) {
        vertex.data = 0
        const weWinHere = !this.isWinningPosition()
        vertex.data = undefined
        if (weWinHere) return true
      }

      if (canPlay1) {
        vertex.data = 1
        const weWinHere = !this.isWinningPosition()
        vertex.data = undefined
        if (weWinHere) return true
      }
    })
  }
}

function project(g: FruitDeliveryGraph) {
  const now = Date.now()
  const wins = g.isWinningPosition()
  const dt = Date.now() - now
  document.body.append(
    `Player ${wins ? 1 : 2} wins (computation took ${dt}ms).`,
  )
  document.body.append(
    `Nim-value is *${calc(g)} (computation took ${Date.now() - now + dt}ms).`,
  )
  createForceGraph(g).nodeColor((c) =>
    c.data === 0 ? "red"
    : c.data === 1 ? "blue"
    : "gray",
  )
}

function calc(g: FruitDeliveryGraph): Nimber {
  const ret: Nimber[] = []
  for (const v of g.vl) {
    if (
      v.data == null
      && !v.edges.some((x) => x.src.data === 0 || x.dst.data === 0)
    ) {
      v.data = 0
      ret.push(calc(g))
      v.data = undefined
    }
    if (
      v.data == null
      && !v.edges.some((x) => x.src.data === 1 || x.dst.data === 1)
    ) {
      v.data = 1
      ret.push(calc(g))
      v.data = undefined
    }
  }
  return mex(ret)
}

const G = new FruitDeliveryGraph()

const a = G.vertex()
const b = G.vertex()
const c = G.vertex()
const d = G.vertex()
const e = G.vertex()
const f = G.vertex()
const g = G.vertex()

f.data = 0
b.data = 1
G.edge(a, b)
G.edge(b, c)
G.edge(c, d)
G.edge(c, e)
G.edge(e, f)
G.edge(f, a)
G.edge(f, g)
G.edge(a, g)

project(G)
