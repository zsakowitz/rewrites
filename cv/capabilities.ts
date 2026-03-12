import type { Canvas } from "./canvas"
import type { Point } from "./transform"
import type { TransformTarget } from "./transform-target"

export interface Capabilities<T, U extends {}> {
    render?(self: T, cv: Canvas, screen: TransformTarget): void

    hit?: {
        test(self: T, screen: TransformTarget, at: Point): U | null

        hover?: {
            on(self: U): void
            off(self: U): void
        }

        drag?: {
            start(self: U): void
            move(self: U, to: Point): void
            end(self: U, at: Point, revert: boolean): void
        }

        geo?(self: U): Geometry[]
    }
}

export type Geometry =
    | { type: "point"; at: Point }
    | { type: "line"; p0: Point; p1: Point; tmin: number; tmax: number }
