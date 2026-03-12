import type { Canvas } from "./canvas"
import { RENDER } from "./object-actions"
import { type PointList, type Transform } from "./transform"
import type { TransformTarget } from "./transform-target"

export type Object =
    | { type: "path"; tx: Transform; lw: number; path: PointList }
    | { type: "pathIncomplete"; path: PointList }
    | { type: "point"; x: number; y: number }

export function render(cv: Canvas, target: TransformTarget, objects: Object[]) {
    for (const el of objects) {
        RENDER[el.type](cv, target, el as never)
    }
}
