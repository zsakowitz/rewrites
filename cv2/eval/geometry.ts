import type { Vec2 } from "../2d/vec"
import type { Ref, Scene as SceneRaw } from "./scene"

export type AbstractLine = [p0: Vec2, p1: Vec2]

export type Num = { type: "num"; val: number }

export type Point = {
    type: "point"
    val: Vec2
    set: ((v: Vec2) => void) | null
}

export type LineLike<
    A extends 0 | -1e999 = 0 | -1e999,
    B extends 1 | 1e999 = 1 | 1e999,
> = {
    type: "line"
    val: AbstractLine
    tmin: A
    tmax: B
}

export type Segment = LineLike<0, 1>
export type Line = LineLike<-1e999, 1e999>

export type Object = Num | Point | LineLike

type Scene = SceneRaw<Object>

export function point(sc: Scene, val: Vec2): Ref<Point> {
    const [ref, setInner] = sc.let<Point>({ type: "point", val, set })

    function set(val: Vec2) {
        setInner({ type: "point", val, set })
    }

    return ref
}

export function segment(
    sc: Scene,
    p0: Ref<Point>,
    p1: Ref<Point>,
): Ref<Segment> {
    return sc.fn([p0, p1], () => ({
        type: "line",
        val: [sc.get(p0).val, sc.get(p1).val],
        tmin: 0,
        tmax: 1,
    }))
}

export function midpoint(sc: Scene, l: Ref<Segment>): Ref<Point> {
    return sc.fn([l], () => {
        const [[x0, y0], [x1, y1]] = sc.get(l).val

        return {
            type: "point",
            val: [(x0 + x1) / 2, (y0 + y1) / 2],
            set: null,
        }
    })
}

export function line(sc: Scene, p0: Ref<Point>, p1: Ref<Point>): Ref<Line> {
    return sc.fn([p0, p1], () => ({
        type: "line",
        val: [sc.get(p0).val, sc.get(p1).val],
        tmin: -1e999,
        tmax: 1e999,
    }))
}

export function perpendicular(
    sc: Scene,
    l: Ref<LineLike>,
    p: Ref<Point>,
): Ref<Line> {
    return sc.fn([l, p], () => {
        const [[x1, y1], [x2, y2]] = sc.get(l).val
        const [x0, y0] = sc.get(p).val

        return {
            type: "line",
            val: [
                [x0, y0],
                [x0 + y2 - y1, y0 + x1 - x2],
            ],
            tmin: -1e999,
            tmax: 1e999,
        }
    })
}

function isec(
    [[x1, y1], [x2, y2]]: AbstractLine,
    [[x3, y3], [x4, y4]]: AbstractLine,
): Vec2 {
    const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

    const x1y2 = x1 * y2
    const x2y1 = y1 * x2
    const x3y4 = x3 * y4
    const x4y3 = y3 * x4

    return [
        ((x1y2 - x2y1) * (x3 - x4) - (x1 - x2) * (x3y4 - x4y3)) / d,
        ((x1y2 - x2y1) * (y3 - y4) - (y1 - y2) * (x3y4 - x4y3)) / d,
    ]
}

export function intersection(
    sc: Scene,
    a: Ref<LineLike>,
    b: Ref<LineLike>,
): Ref<Point> {
    return sc.fn([a, b], () => {
        const la = sc.get(a).val
        const lb = sc.get(b).val
        return { type: "point", val: isec(la, lb), set: null }
    })
}

export function perpendicularbisector(sc: Scene, l: Ref<Segment>): Ref<Line> {
    return perpendicular(sc, l, midpoint(sc, l))
}
