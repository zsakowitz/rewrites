import { Canvas } from "./canvas"
import {
    ColorPurple,
    OpacityPointHalo,
    SizePoint,
    SizePointHaloWide,
} from "./dcg"
import type { Object } from "./object"
import type { InteractionHandler } from "./object-interactor"
import { getPath } from "./path-render"
import { apply, applyList, compose, type Point } from "./transform"
import type { TransformTarget } from "./transform-target"

export const RENDER: {
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

interface InteractionData {
    point: {
        self: Extract<Object, { type: "point" }>
        origin: Point
    }
}

export const INTERACT: {
    [K in keyof InteractionData]: InteractionHandler<
        Extract<Object, { type: K }>,
        InteractionData[K]
    >
} & { __proto__: null } = {
    __proto__: null,

    point: {
        test(screen, ev, self) {
            const [x, y] = apply(screen.toScreen(), [self.x, self.y])

            if (Math.hypot(x - ev.offsetX, y - ev.offsetY) > 12) {
                return null
            }

            const origin = apply(screen.toLocal(), [ev.offsetX, ev.offsetY])
            return { self, origin }
        },
        drag(screen, ev, data) {
            const [x, y] = apply(screen.toLocal(), [ev.offsetX, ev.offsetY])
            data.self.x = x
            data.self.y = y
        },

        finish(screen, ev, data, cancel) {
            if (cancel) {
                data.self.x = data.origin[0]
                data.self.y = data.origin[1]
            }
        },
    },
}
