import { Canvas, type EventsCanvas } from "./canvas"

import { di } from "./debug"
import { DEFAULT } from "./object-default"
import { render, type Object } from "./object"
import { Interactor, type EventsInteractor } from "./object-interactor"
import { PathRecorder, type EventsPathRecorder } from "./path-recorder"
import { simplifyPath } from "./path-render"
import { TransformTarget, type EventsScreen } from "./transform-target"

type Events = unknown
    & EventsCanvas
    & EventsPathRecorder
    & EventsScreen
    & EventsInteractor

const events: Events = {
    onCanvasResize: update,
    onPathUpdate: update,
    onScreenUpdate: update,
    onObjectInteraction: update,

    onPathFinish(raw) {
        const path = simplifyPath(raw.points)
        const tx = screen.toLocal()
        const lw = -tx.zy * 2
        objects.push({ type: "path", tx, lw, path })
    },
}

const cv = new Canvas(events)
const paths = new PathRecorder(events)
const screen = new TransformTarget(events, cv.el)
const itor = new Interactor(events)

const objects: Object[] = DEFAULT.slice()

function getIncomplete(): Object[] {
    return paths
        .getIncomplete()
        .map((x) => ({ type: "pathIncomplete", path: x.points }))
}

function handleDOMEvent(ev: PointerEvent | WheelEvent) {
    if (ev.type == "wheel") {
        screen.handleEvent(ev)
        return
    }

    ev = ev as PointerEvent

    cv.el.setPointerCapture(ev.pointerId)

    if (itor.handleEvent(ev, objects, screen)) {
        return
    }

    if (itor.isActive()) {
        return
    }

    if (ev.type == "pointerdown") {
        if (ev.pointerType == "touch") {
            screen.handleEvent(ev)
        } else {
            paths.handleEvent(ev)
        }
    } else {
        paths.handleEvent(ev) || screen.handleEvent(ev)
    }
}

cv.el.addEventListener("pointermove", handleDOMEvent, { passive: true })
cv.el.addEventListener("pointerup", handleDOMEvent, { passive: true })
cv.el.addEventListener("pointercancel", handleDOMEvent, { passive: true })
cv.el.addEventListener("pointerdown", handleDOMEvent, { passive: true })
cv.el.addEventListener("wheel", (ev) => ev.preventDefault(), { passive: false })
cv.el.addEventListener("wheel", handleDOMEvent, { passive: true })

function update() {
    di.write`
${screen.pos.tx}
${screen.pos.ty}
${screen.pos.zx}
${screen.pos.zy}
    `

    cv.clear()

    render(cv, screen.toScreen(), objects)
    render(cv, screen.toScreen(), getIncomplete())
}
