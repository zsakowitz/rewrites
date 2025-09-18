import type ForceGraph from "force-graph"
import { Graph, type Edge, type Vertex } from ".."
import { createForceGraph } from "../force"

type V = { label: string }
type E = { kind: "R" | "B" | "G"; hacked: boolean }
const graph = new Graph<V, E>()

function parse(text: string) {
  graph.clear()
  const nodes: Record<string, Vertex<V, E>> = Object.create(null)
  nodes[0] = graph.vertex({ label: "0" })

  const data = text
    .split("\n")
    .map((x) => x.match(/^(\d+)\s*([RBG])\s*(\d+)$/))
    .filter((x) => x != null)
    .map((x) => ({ src: x[1]!, kind: x[2]! as "R" | "B" | "G", dst: x[3]! }))

  for (const { src, kind, dst } of data) {
    const srcV = (nodes[src] ??= graph.vertex({ label: src }))
    const dstV = (nodes[dst] ??= graph.vertex({ label: dst }))
    graph.edge(srcV, dstV, { kind, hacked: false })
  }
}

parse(`
0 R 1
0 R 2
0 R 3
0 B 4
`)

let fdg: ForceGraph<Vertex<V, E>, Edge<V, E>>
function redraw() {
  fdg ??= createForceGraph(graph)

  fdg.nodeRelSize(8)

  fdg.nodeCanvasObject((obj, ctx) => {
    if (obj.data.label == "0") {
      ctx.beginPath()
      ctx.moveTo(obj.x! - 80, obj.y!)
      ctx.lineTo(obj.x! + 80, obj.y!)
      ctx.lineCap = "round"
      ctx.strokeStyle = "#1e293b"
      ctx.lineWidth = 0.5 * fdg.nodeRelSize()
      ctx.stroke()
      return
    }

    const size = 0.3 * fdg.nodeRelSize()

    ctx.beginPath()
    ctx.fillStyle = "#fff"
    ctx.strokeStyle = "black"
    ctx.ellipse(obj.x!, obj.y!, size, size, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.lineWidth = 0.75
    ctx.stroke()

    ctx.textBaseline = "middle"
    ctx.textAlign = "center"
    ctx.fillStyle = "black"
    ctx.font = "4px sans-serif"
    ctx.fillStyle = "black"
    ctx.fillText("" + obj.data.label, obj.x!, obj.y!)
  })

  fdg.linkCanvasObject((obj, ctx) => {
    const size = 0.5 * fdg.nodeRelSize()

    ctx.beginPath()
    let x1 = obj.src.x!
    let y1 = obj.src.y!
    let x2 = obj.dst.x!
    let y2 = obj.dst.y!
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.lineCap = "round"
    ctx.strokeStyle = {
      R: "#f00",
      G: "#16a34a",
      B: "#00f",
    }[obj.data.kind]
    ctx.lineWidth = 0.8 * size
    ctx.stroke()
  })

  // fdg.onNodeRightClick(feed)

  fdg.graphData({ nodes: graph.vl.slice(), links: graph.el.slice() })

  fdg.autoPauseRedraw(false)

  fdg.onRenderFramePre(() => {
    const GROUND = graph.vl.find((x) => x.data.label == "0")
    if (GROUND) {
      GROUND.x = 0
      GROUND.y = 50
      GROUND.fx = 0
      GROUND.fy = 50
      GROUND.vx = 0
      GROUND.vy = 0
    }
  })

  return fdg
}
redraw()
