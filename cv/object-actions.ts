import type { Capabilities } from "./capabilities"
import {
    ColorBlue,
    ColorPurple,
    OpacityPointHalo,
    SizeLine,
    SizePoint,
    SizePointHaloWide,
} from "./dcg"
import type { Object } from "./object"
import { getPath } from "./path-render"
import { apply, applyList, compose, inverse, type Point } from "./transform"

interface HitData {
    path: never
    pathIncomplete: never
    point: { self: Extract<Object, { type: "point" }>; origin: Point }
    segment: never
}

export const CAPABILITIES: {
    [K in Object["type"]]: Capabilities<
        Extract<Object, { type: K }>,
        HitData[K]
    >
} & { __proto__: null } = {
    __proto__: null,

    path: {
        render(self, { ctx }, screen) {
            const tx = compose(self.tx, screen.toScreen())

            ctx.strokeStyle = "white"
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.fillStyle = "white"
            ctx.lineWidth = screen.toScreenDelta(self.lw)
            ctx.stroke(getPath(applyList(tx, self.path)))
        },
    },

    pathIncomplete: {
        render(self, { ctx }) {
            ctx.strokeStyle = "white"
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.fillStyle = "white"
            ctx.lineWidth = 2
            ctx.stroke(getPath(self.path))
        },
    },

    point: {
        render(self, { ctx }, screen) {
            const tx = screen.toScreen()
            const [x, y] = apply(tx, self.at)

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

        hit: {
            test(self, toScreen, at) {
                const pos = apply(toScreen, self.at)

                if (Math.hypot(pos[0] - at[0], pos[1] - at[1]) > 12) {
                    return
                }

                const origin = apply(inverse(toScreen), at)
                return { self, origin }
            },

            drag: {
                start(self) {
                    return !!Object.getOwnPropertyDescriptor(self.self, "at")
                        ?.value
                },
                move(self, to) {
                    self.self.at = to
                },
                end(self, at, revert) {
                    self.self.at = revert ? self.origin : at
                },
            },
        },
    },

    segment: {
        render(self, { ctx }, screen) {
            const tx = screen.toScreen()
            const [x0, y0] = apply(tx, self.p0)
            const [x1, y1] = apply(tx, self.p1)

            ctx.strokeStyle = ColorBlue
            ctx.lineWidth = SizeLine
            ctx.lineCap = "round"

            ctx.beginPath()
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y1)
            ctx.stroke()
        },
    },
}
