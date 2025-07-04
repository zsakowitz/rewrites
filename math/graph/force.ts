import ForceGraph from "force-graph"
import type { Edge, Graph, Vertex } from "."

export function createForceGraph<T, E>(graph: Graph<T, E>) {
  const el = document.createElement("div")
  document.body.append(el)
  const fdg = new ForceGraph<Vertex<T, E>, Edge<T, E>>(el)
  fdg.graphData({ nodes: graph.vl, links: graph.el })
  fdg.autoPauseRedraw(false)
  addEventListener("resize", () => {
    fdg.width(innerWidth)
    fdg.height(innerHeight)
  })
  return fdg
}
