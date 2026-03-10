import {
    getStrokePoints,
    type StrokeOptions,
    type Vec2,
} from "perfect-freehand"
import { di } from "./debug"
import { simplifyRadialDist } from "./simplify"
import { flat, unflat, type Point, type PointList } from "./transform"

interface Path {
    id: number
    points: Point[]
    predicted: number
}

export class PathCapturer {
    active: Record<number, Path> = Object.create(null)
    destroy

    constructor(readonly el: HTMLElement) {
        const down = this.#onDown.bind(this)
        const move = this.#onMove.bind(this)
        const up = this.#onUp.bind(this)

        el.addEventListener("pointerdown", down, { passive: true })
        el.addEventListener("pointermove", move, { passive: true })
        el.addEventListener("pointerup", up, { passive: true })
        el.addEventListener("pointercancel", up, { passive: true })

        this.destroy = () => {
            el.removeEventListener("pointerdown", down)
            el.removeEventListener("pointermove", move)
            el.removeEventListener("pointerup", up)
            el.removeEventListener("pointercancel", up)
        }
    }

    onChange:
        | ((this: PathCapturer, path: Path, ev: PointerEvent) => void)
        | null = null

    onEnd: ((this: PathCapturer, path: Path, ev: PointerEvent) => void) | null =
        null

    #onDown(ev: PointerEvent) {
        if (ev.pointerType == "touch") {
            return
        }

        this.el.setPointerCapture(ev.pointerId)

        this.active[ev.pointerId] = {
            id: ev.pointerId,
            points: [[ev.offsetX, ev.offsetY]],
            predicted: 0,
        }

        this.onChange?.(this.active[ev.pointerId]!, ev)
    }

    #onMove(ev: PointerEvent) {
        const active = this.active[ev.pointerId]
        if (!active) return

        for (let i = 0; i < active.predicted; i++) {
            active.points.pop()
        }

        if (
            ev.offsetX == active.points.at(-1)![0]
            && ev.offsetY == active.points.at(-1)![1]
        )
            return

        const coalesced = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev]

        for (const ev of coalesced) {
            active.points.push([ev.offsetX, ev.offsetY])
        }

        const predicted = ev.getPredictedEvents()

        for (const ev of predicted) {
            active.points.push([ev.offsetX, ev.offsetY])
        }
        active.predicted = predicted.length

        const item = di.div``
        if (
            predicted.length == 0
            && Math.hypot(ev.movementX, ev.movementY) > 2
        ) {
            active.points.push([
                ev.offsetX + ev.movementX,
                ev.offsetY + ev.movementY,
            ])
            active.predicted = 1
        }
        item.value = `${predicted.length} ${active.predicted}`

        this.onChange?.(this.active[ev.pointerId]!, ev)
    }

    #onUp(ev: PointerEvent) {
        const active = this.active[ev.pointerId]
        if (!active) return

        for (let i = 0; i < active.predicted; i++) {
            active.points.pop()
        }

        active.points.push([ev.offsetX, ev.offsetY])

        delete this.active[ev.pointerId]
        this.onEnd?.(active, ev)
    }
}

const average = (a: number, b: number) => (a + b) / 2

export function getPath1(p: PointList): Path2D {
    // Trim SVG path data so number are each two decimal points. This
    // improves SVG exports, and prevents rendering errors on points
    // with long decimals.
    const TO_FIXED_PRECISION =
        /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g

    const getSvgPathFromStroke = (points: number[][]): string => {
        if (!points.length) {
            return ""
        }

        const max = points.length - 1

        return points
            .reduce(
                (acc, point, i, arr) => {
                    if (i === max) {
                        acc.push(point, (point + arr[0]) / 2, "L", arr[0], "Z")
                    } else {
                        acc.push(point, (point + arr[i + 1]) / 2)
                    }
                    return acc
                },
                ["M", points[0], "Q"],
            )
            .join(" ")
            .replace(TO_FIXED_PRECISION, "$1")
    }

    return new Path2D(getSvgPathFromStroke(unflat(p)))
}

export function getPath(p: PointList) {
    // {
    //     const pt = new Path2D()
    //     pt.moveTo(p[0]!, p[1]!)
    //     for (let i = 2; i < p.length; i += 2) {
    //         pt.lineTo(p[i]!, p[i + 1]!)
    //     }
    //     return pt
    // }

    const len = p.length

    if (len == 0) return new Path2D()

    if (len == 2) {
        const pt = new Path2D()
        pt.moveTo(p[0]!, p[1]!)
        return pt
    }

    if (len == 4) {
        const pt = new Path2D()
        pt.moveTo(p[0]!, p[1]!)
        pt.lineTo(p[2]!, p[3]!)
        return pt
    }

    let result = `M${p[0]!},${p[1]!} Q${p[2]!},${p[3]!} ${average(p[2]!, p[4]!)},${average(
        p[3]!,
        p[5]!,
    )} T`

    for (let i = 4, max = len - 2; i < max; i += 2) {
        result += `${average(p[i]!, p[i + 2]!)},${average(p[i + 1]!, p[i + 3]!)} `
    }

    result += `${p[p.length - 2]},${p[p.length - 1]} `

    return new Path2D(result)
}

const options: StrokeOptions = {
    thinning: 0,
    smoothing: 0,
    streamline: 0.5,
    easing: (t) => Math.sin((t * Math.PI) / 2), // https://easings.net/#easeOutSine
    last: true,
    size: 2,
}

export function getPathRaw(points: Point[], last: boolean): PointList {
    // points = raw
    const path = simplifyRadialDist(points, 1)
    const stroke = getStrokePoints(path as Vec2[], options)
    return flat(path)
}

const raw: Point[] = [
    [311.5, 318.5],
    [311.5, 319.5],
    [311.5, 325],
    [311.5, 338],
    [311.5, 358],
    [311.5, 379],
    [311.5, 400.5],
    [311.5, 422.5],
    [311.5, 447.5],
    [311.5, 476.5],
    [311.5, 502.5],
    [311.5, 521],
    [311.5, 535.5],
    [311.5, 546],
    [311.5, 552.5],
    [311.5, 556.5],
    [311.5, 559.5],
    [311, 561],
    [310.5, 562],
    [310.5, 563],
    [310.5, 563.5],
    [310.5, 562.5],
    [310.5, 560.5],
    [310.5, 555],
    [310.5, 546.5],
    [310.5, 536],
    [310.5, 525.5],
    [310.5, 517],
    [310.5, 510],
    [310, 503],
    [309, 497.5],
    [309, 493],
    [308.5, 489.5],
    [308.5, 486.5],
    [308.5, 483],
    [308.5, 480],
    [308.5, 477.5],
    [308.5, 475],
    [308.5, 472.5],
    [308.5, 470.5],
    [309, 469],
    [309.5, 467.5],
    [309.5, 466.5],
    [310, 465.5],
    [310, 465],
    [310.5, 465],
    [311.5, 464.5],
    [315.5, 463],
    [322.5, 461],
    [332.5, 457.5],
    [343, 454],
    [352.5, 450.5],
    [359.5, 448],
    [363, 446.5],
    [365, 445.5],
    [365.5, 445.5],
    [365.5, 445],
    [364.5, 444.5],
    [363, 444.5],
    [360.5, 444.5],
    [356.5, 444.5],
    [350.5, 445.5],
    [342.5, 448],
    [335, 450.5],
    [328.5, 453],
    [323, 455.5],
    [319.5, 457.5],
    [317.5, 458.5],
    [316, 459.5],
    [315.5, 460],
    [315, 460.5],
    [314.5, 461.5],
    [314, 462.5],
    [313, 464],
    [312, 465.5],
    [311, 467],
    [310.5, 468],
    [310, 468.5],
    [310, 469],
    [309.5, 469.5],
    [309.5, 470],
    [309, 470.5],
    [309, 471],
    [309, 471.5],
    [309.5, 472],
    [310, 472],
    [311.5, 473],
    [314, 475.5],
    [317.5, 479.5],
    [322, 483.5],
    [326.5, 487.5],
    [330, 491],
    [334, 494.5],
    [338, 497],
    [341.5, 500],
    [345.5, 503.5],
    [349.5, 507.5],
    [353.5, 512],
    [358, 517],
    [362, 521],
    [365.5, 524.5],
    [368, 527],
    [369.5, 528],
    [370, 529],
    [370.5, 529],
    [371, 529],
    [371, 528.5],
    [371, 526],
    [372.5, 522.5],
    [375.5, 516.5],
    [379.5, 510],
    [384, 503.5],
    [388.5, 497],
    [393, 490],
    [397, 483.5],
    [399.5, 479],
    [401.5, 475],
    [403, 471],
    [404, 467.5],
    [404.5, 464.5],
    [404.5, 461.5],
    [404.5, 459],
    [403.5, 457],
    [402.5, 455.5],
    [401, 454.5],
    [398.5, 453.5],
    [396, 453],
    [393, 453],
    [390, 453.5],
    [386.5, 455.5],
    [383.5, 459.5],
    [381, 464.5],
    [379.5, 471.5],
    [379.5, 479],
    [379.5, 486.5],
    [379.5, 492.5],
    [380, 496.5],
    [381.5, 500],
    [382, 502],
    [383, 503],
    [383.5, 503.5],
    [384, 503.5],
    [385, 503],
    [386.5, 501.5],
    [388.5, 497.5],
    [390, 492],
    [392, 485.5],
    [393.5, 479],
    [394.5, 473],
    [395, 467.5],
    [395, 463.5],
    [395, 460.5],
    [395, 459],
    [395, 458],
    [395.5, 458],
    [396, 460],
    [396.5, 465],
    [398, 471],
    [400.5, 479],
    [404.5, 488],
    [410, 498.5],
    [415.5, 508.5],
    [420.5, 516.5],
    [424.5, 523],
    [428, 527.5],
    [431.5, 530.5],
    [434.5, 532.5],
    [438, 533],
    [441.5, 532],
    [446, 526.5],
    [450.5, 514],
    [454, 494.5],
    [456, 470.5],
    [457.5, 446],
    [458.5, 422],
    [459.5, 399],
    [460, 380],
    [460, 363.5],
    [460, 349.5],
    [459.5, 340],
    [458.5, 333.5],
    [457, 329],
    [455.5, 326],
    [454.5, 324],
    [454, 323],
    [453.5, 322.5],
    [453.5, 325],
    [454, 334],
    [455.5, 351],
    [457.5, 373.5],
    [459.5, 399],
    [461.5, 426.5],
    [463.5, 449],
    [465, 468],
    [466.5, 485],
    [467, 497.5],
    [467, 507.5],
    [467.5, 515.5],
    [468, 521],
    [468.5, 525],
    [469, 527.5],
    [469.5, 529],
    [470, 529.5],
    [470, 529],
    [470, 528.5],
    [470, 526.5],
    [469.5, 523],
    [468.5, 517.5],
    [467.5, 508],
    [467, 495.5],
    [466, 479.5],
    [464.5, 462],
    [464, 446.5],
    [463, 432.5],
    [463, 422],
    [462.5, 414.5],
    [462, 408.5],
    [461, 403.5],
    [459.5, 400],
    [458, 397],
    [457, 395],
    [456, 393.5],
    [455, 392],
    [453.5, 390],
    [452, 387.5],
    [450.5, 385],
    [450, 383.5],
    [449.5, 382.5],
    [449, 382],
    [449.5, 382],
    [451.5, 383],
    [456.5, 386],
    [464, 389.5],
    [473.5, 393],
    [482.5, 395.5],
    [489.5, 397],
    [495.5, 398],
    [499.5, 398],
    [501.5, 398],
    [502, 398],
    [502, 398],
]
