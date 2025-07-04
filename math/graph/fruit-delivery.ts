import { Graph } from "."
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
  createForceGraph(g)
}

const g = new FruitDeliveryGraph()

const H1 = g.vertex()
const H2 = g.vertex()
const H3 = g.vertex()
const H4 = g.vertex()
const H5 = g.vertex()

g.edge(H1, H2)
g.edge(H1, H3)
g.edge(H1, H4)
g.edge(H1, H5)

g.edge(H2, H3)
g.edge(H2, H4)
g.edge(H2, H5)

g.edge(H3, H4)
g.edge(H3, H5)

g.edge(H4, H5)

project(g)
