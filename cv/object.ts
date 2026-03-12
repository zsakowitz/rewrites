import type { Canvas } from "./canvas"
import { CAPABILITIES } from "./object-actions"
import { type Point, type PointList, type Transform } from "./transform"
import type { TransformTarget } from "./transform-target"

export type Object =
    | { type: "path"; tx: Transform; lw: number; path: PointList }
    | { type: "pathIncomplete"; path: PointList }
    | { type: "point"; at: Point }
    | { type: "segment"; p0: Point; p1: Point }

export function render(cv: Canvas, screen: TransformTarget, objects: Object[]) {
    for (const el of objects) {
        CAPABILITIES[el.type].render?.(el as never, cv, screen)
    }
}
