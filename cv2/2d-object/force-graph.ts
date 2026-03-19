import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2 } from "../2d/tform"
import { norm, rotate, type Vec2 } from "../2d/vec"
import { ColorBlue, ColorGreen } from "../tbd/dcg"

export class ForceGraph extends Object2 {
    readonly nodes: { pos: Vec2; label: string }[] = []
    readonly edges: [src: number, dst: number][] = []

    draw({ ctx, tlo }: Canvas2): void {
        const nodeSize = 20

        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        for (const [src, dst] of this.edges) {
            const [x1, y1] = apply2(tlo, this.nodes[src]!.pos)
            const [x2, y2] = apply2(tlo, this.nodes[dst]!.pos)

            const norm5 = norm([x2 - x1, y2 - y1], 10)
            const [xd, yd] = norm([x2 - x1, y2 - y1], nodeSize + 4)
            const [xc, yc] = rotate(
                norm5,
                Math.sin(0.85 * Math.PI),
                Math.cos(0.85 * Math.PI),
            )
            const [xe, ye] = rotate(
                norm5,
                Math.sin(-0.85 * Math.PI),
                Math.cos(-0.85 * Math.PI),
            )

            ctx.beginPath()
            ctx.moveTo(x1 + xd, y1 + yd)
            ctx.lineTo(x2 - xd, y2 - yd)
            ctx.moveTo(x2 - xd, y2 - yd)

            ctx.lineTo(x2 - xd + xc, y2 - yd + yc)
            ctx.lineTo(x2 - xd + xe, y2 - yd + ye)
            ctx.closePath()
            ctx.strokeStyle = ctx.fillStyle = ColorGreen
            ctx.lineWidth = 2.5
            ctx.stroke()
            ctx.fill()
        }

        for (const node of this.nodes) {
            const [ox, oy] = apply2(tlo, node.pos)
            ctx.beginPath()
            ctx.fillStyle = ColorBlue
            ctx.ellipse(ox, oy, nodeSize, nodeSize, 0, 0, 2 * Math.PI)
            ctx.globalAlpha = 0.3
            ctx.fill()
            ctx.globalAlpha = 1
            ctx.strokeStyle = ColorBlue
            ctx.lineWidth = 2.5
            ctx.stroke()
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.font = "14px Symbola"
            ctx.strokeStyle = "#fff"
            ctx.globalAlpha = 0.3
            ctx.lineWidth = 3
            ctx.strokeText("" + node.label, ox, oy + 1)
            ctx.globalAlpha = 1
            ctx.fillText("" + node.label, ox, oy + 1)
        }
    }
}
