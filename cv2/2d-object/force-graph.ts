import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"
import type { Vec2 } from "../2d/vec"

export class ForceGraph extends Object2 {
    readonly nodes: { pos: Vec2; label: string }[] = []
    readonly edges: [src: number, dst: number][] = []

    draw(cv: Canvas2): void {}
}
