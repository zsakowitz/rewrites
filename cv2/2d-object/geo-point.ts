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
        drawPoint(
            cv,
            this.pos,
            this.hovered ? SizePointHaloWide : SizePoint,
            SizePointHaloWide,
        )
    }

    includes({ cv, offset: po, size }: PEvent): boolean {
        const [ox, oy] = apply2(cv.tlo, this.pos)
        return Math.hypot(ox - po[0], oy - po[1]) <= SizePointHaloWide * size
    }

    onPointerEnter(ev: PEvent): void {
        this.hovered = true
        ev.cv.pushCursor("grab")
    }

    onPointerDown(ev: PEvent): void {
        this.active = true
        ev.cv.pushCursor("grabbing")
    }

    onPointerMove(ev: PEvent): void {
        if (this.active) {
            this.pos = apply2(ev.cv.tol, ev.offset)
        }
    }

    onPointerUp(ev: PEvent): void {
        this.active = false
        ev.cv.popCursor()
    }

    onPointerCancel(ev: PEvent): void {
        this.active = false
        ev.cv.popCursor()
    }

    onPointerLeave(ev: PEvent): void {
        this.hovered = false
        ev.cv.popCursor()
    }
}
