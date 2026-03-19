import type { Canvas2 } from "../2d/canvas"
import { Object2, type PEvent } from "../2d/object"
import { apply2 } from "../2d/tform"
import type { Vec2 } from "../2d/vec"
import { SizePointHaloWide } from "../tbd/dcg"
import { drawPoint } from "./geo"

export class GeoPoint extends Object2 {
    pos: Vec2 = [0, 0]
    color = "blue"

    draw(cv: Canvas2): void {
        drawPoint(cv, this.pos, this.color)
    }

    includes({ cv, po }: PEvent): boolean {
        const [ox, oy] = apply2(cv.tlo, this.pos)
        return Math.hypot(ox - po[0], oy - po[1]) <= SizePointHaloWide
    }

    onPointerEnter(ev: PEvent): void {
        this.color = "red"
    }

    onPointerLeave(ev: PEvent): void {
        this.color = "green"
    }
}
