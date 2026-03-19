import type { Canvas2 } from "../2d/canvas"
import { Object2, type PEvent } from "../2d/object"
import { apply2 } from "../2d/tform"
import type { Vec2 } from "../2d/vec"
import { SizePoint, SizePointHaloWide } from "../tbd/dcg"
import { drawPoint } from "./geo"

export class GeoPoint extends Object2 {
    pos: Vec2 = [0, 0]
    active = false
    hovered = false

    draw(cv: Canvas2): void {
        drawPoint(cv, this.pos, this.hovered ? SizePointHaloWide : SizePoint)
    }

    includes({ cv, offset: po }: PEvent): boolean {
        const [ox, oy] = apply2(cv.tlo, this.pos)
        return Math.hypot(ox - po[0], oy - po[1]) <= SizePointHaloWide
    }

    onPointerEnter(ev: PEvent): void {
        this.hovered = true
    }

    onPointerDown(ev: PEvent): void {
        this.active = true
    }

    onPointerMove(ev: PEvent): void {
        if (this.active) {
            this.pos = apply2(ev.cv.tol, ev.offset)
        }
    }

    onPointerUp(ev: PEvent): void {
        this.active = false
    }

    onPointerCancel(ev: PEvent): void {
        this.active = false
    }

    onPointerLeave(ev: PEvent): void {
        this.hovered = false
    }
}
