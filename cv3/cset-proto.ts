import type { Camera } from "./camera"
import * as m4 from "./mat"

export interface ControlsProps {
    // Raw input data
    delta: m4.Vec3
    source: "wasd" | "wheel"

    // Active keyboard modifiers
    shiftKey: boolean
    altKey: boolean
}

export type ControlSet = (camera: Camera, props: ControlsProps) => void

const keyToDir: { readonly [x: string]: m4.Vec3 } = {
    KeyD: [1, 0, 0],
    KeyA: [-1, 0, 0],
    KeyW: [0, 1, 0],
    KeyS: [0, -1, 0],
    KeyE: [0, 0, 1],
    KeyQ: [0, 0, -1],
}

export function registerControls(camera: Camera, cset: ControlSet) {
    let hasShift = false
    let hasAlt = false
    let activeControls = 0

    const heldKeys: Record<string, boolean> = {
        KeyD: false,
        KeyA: false,
        KeyW: false,
        KeyS: false,
        KeyE: false,
        KeyQ: false,
    }

    const dirAllKeys: m4.Vec3 = [0, 0, 0]
    let keyRafId = -1

    document.body.addEventListener("keydown", (ev) => {
        if (ev.ctrlKey || ev.metaKey) return

        if (!activeControls) {
            hasShift = ev.shiftKey
            hasAlt = ev.altKey
        }

        const dir = keyToDir[ev.code]
        if (dir != null) {
            ev.preventDefault()
            if (!heldKeys[ev.code]) {
                heldKeys[ev.code] = true
                m4.v3add(dirAllKeys, dir)
                activeControls++
                queueKeySignal()
            }
        }
    })

    document.body.addEventListener("keyup", (ev) => {
        const dir = keyToDir[ev.code]
        if (dir != null && heldKeys[ev.code]) {
            heldKeys[ev.code] = false
            ev.preventDefault()
            m4.v3sub(dirAllKeys, dir)
            activeControls--
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

        sendKeySignal()
    }

    function sendKeySignal() {
        if (dirAllKeys[0] || dirAllKeys[1]) {
            cset(camera, {
                delta: m4.v3copy(dirAllKeys),
                source: "wasd",
                shiftKey: hasShift,
                altKey: hasAlt,
            })
        }

        if (activeControls) {
            keyRafId = requestAnimationFrame(sendKeySignal)
        } else {
            keyRafId = -1
        }
    }

    window.addEventListener("wheel", (ev) => {
        cset(camera, {
            delta: [ev.deltaX, ev.deltaY, ev.deltaZ],
            source: "wheel",
            shiftKey: hasShift,
            altKey: hasAlt,
        })
    })

    document.body.addEventListener("pointerdown", (ev) => {})

    document.body.addEventListener("pointermove", (ev) => {})

    document.body.addEventListener("pointerup", (ev) => {})

    document.body.addEventListener("pointercancel", (ev) => {})
}
