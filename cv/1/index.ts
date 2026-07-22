import { Canvas, type EventsCanvas } from "./canvas"

import { Controls, type EventsControls } from "./controls"

import { di } from "./debug"
import { render, type Object } from "./object"
import { Interactor, type EventsInteractor } from "./object-interactor"
import { PathRecorder, type EventsPathRecorder } from "./path-record"
import { simplifyPath } from "./path-render"
import { DEFAULT } from "./scene-default"

type Events = unknown
    & EventsCanvas
    & EventsPathRecorder
    & EventsControls
    & EventsInteractor

const events: Events = {
    onCanvasResize: update,
    onPathUpdate: update,
    onControlsUpdate: update,
    onObjectInteraction: update,

    onPathFinish(raw) {
        const path = simplifyPath(raw.points)
        const tx = controls.toLocal()
        const lw = -tx.zy * 2
        objects.push({ type: "path", tx, lw, path })
    },
}

const canvas = new Canvas(events)
const paths = new PathRecorder(events)
const controls = new Controls(events, canvas.el)
const itor = new Interactor(events)

const objects: Object[] = DEFAULT.slice()

function getIncomplete(): Object[] {
    return paths
        .getIncomplete()
        .map((x) => ({ type: "pathIncomplete", path: x.points }))
}

function handleDOMEvent(ev: PointerEvent | WheelEvent) {
    if (ev.type == "wheel") {
        controls.handleEvent(ev)
        return
    }

    ev = ev as PointerEvent

    canvas.el.setPointerCapture(ev.pointerId)

    if (itor.handleEvent(ev, objects, controls)) {
        return
    }

    if (itor.isActive()) {
        return
    }

    if (ev.type == "pointerdown") {
        if (ev.pointerType == "touch") {
            controls.handleEvent(ev)
        } else {
            paths.handleEvent(ev)
        }
    } else {
        paths.handleEvent(ev) || controls.handleEvent(ev)
    }
}

canvas.el.addEventListener("pointermove", handleDOMEvent, { passive: true })
canvas.el.addEventListener("pointerup", handleDOMEvent, { passive: true })
canvas.el.addEventListener("pointercancel", handleDOMEvent, { passive: true })
canvas.el.addEventListener("pointerdown", handleDOMEvent, { passive: true })
canvas.el.addEventListener("wheel", (ev) => ev.preventDefault(), {
    passive: false,
})
canvas.el.addEventListener("wheel", handleDOMEvent, { passive: true })

function update() {
    di.write`
${controls.pos.tx}
${controls.pos.ty}
${controls.pos.zx}
${controls.pos.zy}
    `

    canvas.clear()

    render(canvas, controls.toScreen(), objects)
    render(canvas, controls.toScreen(), getIncomplete())
}
