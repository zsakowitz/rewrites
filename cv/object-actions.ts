import { getStroke, type Vec2 } from "perfect-freehand"
import type { Capabilities } from "./capabilities"
import {
    ColorBlue,
    ColorPurple,
    OpacityFill,
    OpacityPointHalo,
    SizeLine,
    SizePoint,
    SizePointHaloWide,
} from "./dcg"
import type { Object } from "./object"
import { getPath } from "./path-render"
import {
    apply,
    applyList,
    compose,
    flat,
    inverse,
    unflat,
    type Point,
} from "./transform"

interface HitData {
    path: never
    pathIncomplete: never
    point: { self: Extract<Object, { type: "point" }>; origin: Point }
    line: never
    polygon: never
}

export const CAPABILITIES: {
    [K in Object["type"]]: Capabilities<
        Extract<Object, { type: K }>,
        HitData[K]
    >
} & { __proto__: null } = {
    __proto__: null,

    path: {
        render(self, { ctx }, toScreen) {
            const path = applyList(compose(self.tx, toScreen), self.path)

            ctx.fillStyle = "white"

            const p = getStroke(unflat(path) as Vec2[], {
                size: -self.lw * toScreen.zy,
                simulatePressure: false,
                smoothing: 0,
            })

            ctx.fill(getPath(flat(p), true))
        },
    },

    pathIncomplete: {
        render(self, { ctx }) {
            ctx.strokeStyle = "white"
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.fillStyle = "white"
            ctx.lineWidth = 2
            ctx.stroke(getPath(self.path, false))
        },
    },

    point: {
        render(self, { ctx }, tx) {
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

    line: {
        render(self, { ctx }, tx) {
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

    polygon: {
        render(self, { ctx }, tx) {
            const pt = applyList(tx, self.points)
            if (pt.length <= 2) return

            ctx.strokeStyle = ColorBlue
            ctx.lineWidth = SizeLine
            ctx.lineCap = "round"
            ctx.lineJoin = "round"

            ctx.fillStyle = ColorBlue

            ctx.beginPath()
            ctx.moveTo(pt[0]!, pt[1]!)
            for (let i = 2; i < pt.length; i += 2) {
                ctx.lineTo(pt[i]!, pt[i + 1]!)
            }
            ctx.closePath()
            ctx.globalAlpha = OpacityFill
            ctx.fill()
            ctx.globalAlpha = 1
            ctx.stroke()
        },
    },
}
