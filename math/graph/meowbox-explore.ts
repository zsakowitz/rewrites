import { Graph } from "."
import { h } from "../../easy-jsx"
import { createForceGraph } from "./force"
import { Meowbox } from "./meowbox"
import { solve } from "./meowbox-worker"

const graph = new Graph<0 | 1>()
graph.vertex(1).rect(2, 3, 0)

const matrix = h("pre", null)
// @ts-ignore why did they type it like this
matrix.style =
  "position:fixed;top:1rem;left:1rem;margin:0;user-select:none;pointer-events:none"
let computeResult = compute()
document.body.append(matrix)

let fdg: ReturnType<typeof createVisual>

showVisual()

function createVisual() {
  const fdg = createForceGraph(graph)

  fdg.nodeLabel((v) =>
    Array.from(computeResult.box.row(v.id))
      .map((x, i, a) => (i == a.length - 1 ? x : x && `a${i + 1}`))
      .filter((x) => x)
      .join(" + "),
  )

  fdg.nodeRelSize(8)

  fdg.nodeCanvasObject((obj, ctx) => {
    const size = fdg.nodeRelSize()
    ctx.beginPath()
    ctx.fillStyle = obj.data ? "#44f" : "#ccf"
    ctx.ellipse(obj.x!, obj.y!, size, size, 0, 0, 2 * Math.PI)
    ctx.strokeStyle = computeResult.soln[obj.id] ? "black" : "transparent"
    ctx.lineWidth = 1
    ctx.fill()
    ctx.stroke()
    ctx.textBaseline = "middle"
    ctx.textAlign = "center"
    ctx.fillStyle = obj.data ? "white" : "black"
    ctx.fillText(obj.id + 1 + "", obj.x!, obj.y!)
  })

  fdg.onNodeRightClick((node) => {
    const affected = new Set([node.id])
    for (const edge of graph.ev[node.id] ?? []) {
      const dst = edge.sid == node.id ? edge.did : edge.sid
      affected.add(dst)
    }

    computeResult.soln[node.id]! ^= 1
    for (const target of affected) {
      graph.vl[target]!.data ^= 1
    }

    fdg.resumeAnimation()
  })

  return fdg
}

function compute() {
  const box = Meowbox.fromGraph(graph)

  const { count, soln, time } = solve({
    id: 0,
    cells: box.cells.slice(),
    cols: box.cols,
    rows: box.rows,
  })

  const output = `Solution count: ${count}

Matrix:
${box.toString()}`

  matrix.textContent = output

  return {
    box,
    count,
    soln,
    time,
  }
}

function showVisual() {
  fdg ??= createVisual()
  fdg.graphData({ nodes: graph.vl, links: graph.el })
}
