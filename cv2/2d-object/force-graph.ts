import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import { apply2 } from "../2d/tform"
import { addInto, norm, rotate, type Vec2, type Vec2Mut } from "../2d/vec"
import { ColorGreen } from "../tbd/dcg"

export class ForceGraph<T, E> extends Object2 {
    readonly nodes: { pos: Vec2; label: string; fill: string; data: T }[] = []
    readonly edges: { src: number; dst: number; data: E }[] = []

    draw({ ctx, tlo }: Canvas2): void {
        const nodeSize = 20

        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        for (const { src, dst } of this.edges) {
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
            ctx.fillStyle = node.fill
            ctx.ellipse(ox, oy, nodeSize, nodeSize, 0, 0, 2 * Math.PI)
            ctx.globalAlpha = 0.3
            ctx.fill()
            ctx.globalAlpha = 1
            ctx.strokeStyle = node.fill
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

    update(dt: number): void {
        const F_GRAVITY = -1
        const F_REPULSE = -50
        const F_ATTRACT = 1

        const forces = this.nodes.map(
            ({ pos }): Vec2Mut => [F_GRAVITY * pos[0], F_GRAVITY * pos[1]],
        )

        for (let a = 0; a < this.nodes.length; a++) {
            for (let b = 0; b < this.nodes.length; b++) {
                if (a == b) continue

                const [xa, ya] = this.nodes[a]!.pos
                const [xb, yb] = this.nodes[b]!.pos
                addInto(
                    forces[a]!,
                    norm(
                        [xb - xa, yb - ya],
                        F_REPULSE
                            / Math.max(1e-6, Math.hypot(xb - xa, yb - ya) ** 2),
                    ),
                )
            }
        }

        for (const { src: a, dst: b } of this.edges) {
            const [xa, ya] = this.nodes[a]!.pos
            const [xb, yb] = this.nodes[b]!.pos

            addInto(
                forces[a]!,
                norm(
                    [xb - xa, yb - ya],
                    F_ATTRACT * Math.hypot(xb - xa, yb - ya),
                ),
            )

            addInto(
                forces[b]!,
                norm(
                    [xb - xa, yb - ya],
                    -F_ATTRACT * Math.hypot(xb - xa, yb - ya),
                ),
            )
        }

        for (let i = 0; i < this.nodes.length; i++) {
            const [x0, y0] = this.nodes[i]!.pos
            const [dx, dy] = forces[i]!
            this.nodes[i]!.pos = [x0 + dx * dt, y0 + dy * dt]
        }
    }
}
