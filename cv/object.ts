import type { Canvas } from "./canvas"
import { CAPABILITIES } from "./object-actions"
import { type Point, type PointList, type Transform } from "./transform"

export type Object =
    | { type: "path"; tx: Transform; lw: number; path: PointList }
    | { type: "pathIncomplete"; path: PointList }
    | { type: "point"; at: Point }
    | { type: "line"; p0: Point; p1: Point; tmin: 0 | -1e999; tmax: 1 | 1e999 }
    | { type: "polygon"; points: PointList }

export function render(cv: Canvas, tx: Transform, objects: Object[]) {
    for (const el of objects) {
        CAPABILITIES[el.type].render?.(el as never, cv, tx)
    }
}
