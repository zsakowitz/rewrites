import type { Canvas2 } from "./canvas"
import type { Vec2 } from "./vec"

export class Object2 {
    visible = true

    draw(cv: Canvas2): void {}

    // Related to pointer events.
    includes?(ev: PEvent): boolean
    onPointerEnter?(ev: PEvent): void
    onPointerDown?(ev: PEvent): void
    onPointerMove?(ev: PEvent): void
    onPointerUp?(ev: PEvent): void
    onPointerCancel?(ev: PEvent): void
    onPointerLeave?(ev: PEvent): void
}

export interface PEvent {
    cv: Canvas2
    pointerId: number // pointer id
    offset: Vec2 // offset coords
    unit: Vec2 // unit coords
    size: 1 | 2 // 1 for mouse/stylus, 2 for touch
}
