import type { Canvas } from "./canvas"
import type { Line, Point } from "./geometry"
import { CAPABILITIES } from "./object-actions"
import type { PointList, Transform } from "./transform"

export type Object =
    | { type: "path"; tx: Transform; lw: number; path: PointList }
    | { type: "pathIncomplete"; path: PointList }
    | { type: "point"; at: Point }
    | { type: "line"; at: Line; tmin: 0 | -1e999; tmax: 1 | 1e999 }
    | { type: "polygon"; points: PointList }

export function render(cv: Canvas, tx: Transform, objects: Object[]) {
    for (const el of objects) {
        CAPABILITIES[el.type].render?.(el as never, cv, tx)
    }
}
