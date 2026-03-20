import FG, { type NodeObject } from "force-graph"
import { ColorBlue } from "../../cv/dcg"
import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { Graph } from "../tbd/graph"
import { ForceGraph, type FGE, type FGT } from "./force-graph"

interface C {
    label: string
    fill: string
    stroke: string
}

export class ForceGraphLib extends Object2 {
    fdg
    el

    constructor(readonly graph: Graph<C, unknown>) {
        super()
        const el = (this.el = document.createElement("div"))
        this.fdg = new FG<C & NodeObject>(el)
            .graphData({
                nodes: graph.nodes.map((x, i) => ({
                    id: i,
                    ...x.data,
                })),
                links: graph.edges.map((x) => ({
                    source: x.from,
                    target: x.into,
                })),
            })
            .nodeLabel((n) => n.label)
            .linkCurvature(0)
            .d3AlphaDecay(0.015)
            .d3AlphaMin(0.1)
    }

    draw(cv: Canvas2): void {
        const graph = new Graph<FGT, FGE>()
        const data = this.fdg.graphData()
        for (const node of data.nodes) {
            graph.node({
                pos: [(node.x ?? 0) / 20, (node.y ?? 0) / 20],
                label: node.label,
                fill: node.fill,
                stroke: node.stroke,
            })
        }
        for (const link of data.links) {
            const f =
                typeof link.source == "object" ?
                    +link.source.id!
                :   +link.source!

            const i =
                typeof link.target == "object" ?
                    +link.target.id!
                :   +link.target!

            graph.edge(graph.nodes[f]!, graph.nodes[i]!, {
                fill: ColorBlue,
                stroke: ColorBlue,
            })
        }

        ForceGraph.prototype.draw.call({ graph }, cv)
    }
}
