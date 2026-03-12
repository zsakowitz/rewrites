import type { Canvas } from "./canvas"
import type { Point } from "./transform"
import type { TransformTarget } from "./transform-target"

export interface ObjectCapabilities<T, Hit extends {}> {
    render?(self: T, cv: Canvas, screen: TransformTarget): void

    hit?: {
        test(self: T, screen: TransformTarget): Hit | null

        hover?: {
            on(self: Hit): void
            off(self: Hit): void
        }

        drag?: {
            start(self: Hit): void
            move(self: Hit, at: Point): void
            end(self: Hit, at: Point, canceled: boolean): void
        }

        geo?(self: Hit): ObjectGeometry[]
    }
}

export type ObjectGeometry =
    | { type: "point"; at: Point }
    | { type: "line"; p0: Point; p1: Point; t0: number; t1: number }
