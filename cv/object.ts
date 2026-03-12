import type { Canvas } from "./canvas"
import {
    ColorPurple,
    OpacityPointHalo,
    SizePoint,
    SizePointHaloWide,
} from "./dcg"
import { getPath } from "./path-render"
import {
    apply,
    applyList,
    compose,
    type PointList,
    type Transform,
} from "./transform"
import type { TransformTarget } from "./transform-target"

export type Object =
    | { type: "path"; tx: Transform; lw: number; path: PointList }
    | { type: "pathIncomplete"; path: PointList }
    | { type: "point"; x: number; y: number }

const RENDER: {
    [K in Object["type"]]: (
        cv: Canvas,
        screen: TransformTarget,
        object: Extract<Object, { type: K }>,
    ) => void
} & { __proto__: null } = {
    __proto__: null,

    path({ ctx }, screen, object) {
        const tx = compose(object.tx, screen.toScreen())

        ctx.strokeStyle = "white"
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.fillStyle = "white"
        ctx.lineWidth = screen.toScreenDelta(object.lw)
        ctx.stroke(getPath(applyList(tx, object.path)))
    },

    pathIncomplete({ ctx }, _screen, object) {
        ctx.strokeStyle = "white"
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.fillStyle = "white"
        ctx.lineWidth = 2
        ctx.stroke(getPath(object.path))
    },

    point({ ctx }, screen, object) {
        const tx = screen.toScreen()
        const [x, y] = apply(tx, [object.x, object.y])

        ctx.fillStyle = ColorPurple
        ctx.globalAlpha = OpacityPointHalo

        ctx.beginPath()
        ctx.ellipse(
            x,
            y,
            SizePointHaloWide,
            SizePointHaloWide,
            0,
            0,
            2 * Math.PI,
        )
        ctx.fill()

        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.ellipse(x, y, SizePoint, SizePoint, 0, 0, 2 * Math.PI)
        ctx.fill()
    },
}

export function render(cv: Canvas, target: TransformTarget, objects: Object[]) {
    for (const el of objects) {
        RENDER[el.type](cv, target, el as never)
    }
}
