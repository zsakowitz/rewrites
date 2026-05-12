import * as m4 from "./mat"

export interface ControlsProps {
    // Raw input data
    delta: m4.Vec2
    source: "wasd" | "arrow" | "wheel"

    // Active keyboard modifiers
    hasShift: boolean
    hasAlt: boolean
}

export type Controls = (camera: m4.Mat4, props: ControlsProps) => void

const dirWasd: Record<string, m4.Vec2> = {
    KeyW: [0, 1],
    W: [0, 1],
    w: [0, 1],

    KeyD: [1, 0],
    D: [1, 0],
    d: [1, 0],

    KeyS: [0, -1],
    S: [0, -1],
    s: [0, -1],

    KeyA: [-1, 0],
    A: [-1, 0],
    a: [-1, 0],
}

const dirArrow: Record<string, m4.Vec2> = {
    ArrowUp: [0, 1],
    ArrowRight: [1, 0],
    ArrowDown: [0, -1],
    ArrowLeft: [-1, 0],
}

export function registerControls(controls: Controls, camera: m4.Mat4) {
    let hasShift = false
    let hasAlt = false
    let activeControls = 0

    const deltaWasd: m4.Vec2 = [0, 0]
    const deltaArrow: m4.Vec2 = [0, 0]
    let keyRafId = -1

    document.body.addEventListener("keydown", (ev) => {
        if (ev.ctrlKey || ev.metaKey) return

        if (!activeControls) {
            hasShift = ev.shiftKey
            hasAlt = ev.altKey
        }

        const d1 = dirWasd[ev.key ?? ev.code]
        if (d1 != null) {
            ev.preventDefault()
            deltaWasd[0] += d1[0]
            deltaWasd[1] += d1[1]
            activeControls++
            queueKeySignal()
            return
        }

        const d2 = dirArrow[ev.key ?? ev.code]
        if (d2 != null) {
            ev.preventDefault()
            deltaArrow[0] += d2[0]
            deltaArrow[1] += d2[1]
            activeControls++
            queueKeySignal()
            return
        }
    })

    document.body.addEventListener("keyup", (ev) => {
        const d1 = dirWasd[ev.key ?? ev.code]
        if (d1 != null) {
            ev.preventDefault()
            deltaWasd[0] -= d1[0]
            deltaWasd[1] -= d1[1]
            activeControls--
            return
        }

        const d2 = dirArrow[ev.key ?? ev.code]
        if (d2 != null) {
            ev.preventDefault()
            deltaArrow[0] -= d2[0]
            deltaArrow[1] -= d2[1]
            activeControls--
            return
        }

        if (!activeControls) {
            hasShift = ev.shiftKey
            hasAlt = ev.altKey
        }
    })

    function queueKeySignal() {
        if (keyRafId == -1) {
            keyRafId = requestAnimationFrame(queueKeySignal)
        }
    }

    function sendKeySignal() {
        let keepGoing = false

        if (deltaArrow[0] || deltaArrow[1]) {
            keepGoing = true
            controls(camera, {
                delta: deltaArrow,
                source: "arrow",
                hasShift,
                hasAlt,
            })
        }

        if (deltaWasd[0] || deltaWasd[1]) {
            keepGoing = true
            controls(camera, {
                delta: deltaWasd,
                source: "wasd",
                hasShift,
                hasAlt,
            })
        }

        if (keepGoing) {
            keyRafId = requestAnimationFrame(sendKeySignal)
        } else {
            keyRafId = -1
        }
    }

    document.body.addEventListener("wheel", (ev) => {})

    document.body.addEventListener("pointerdown", (ev) => {})

    document.body.addEventListener("pointermove", (ev) => {})

    document.body.addEventListener("pointerup", (ev) => {})

    document.body.addEventListener("pointercancel", (ev) => {})
}

registerControls((camera, props) => {
    console.log(props)
}, m4.identity())
