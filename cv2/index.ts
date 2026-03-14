import { Movable } from "./2d/movable"
import { apply2 } from "./2d/tform"

const el = document.createElement("div")
el.style.backgroundColor = "#ffd0e0"
el.style.width = "320px"
el.style.height = "320px"
el.style.position = "relative"
document.body.appendChild(el)

const el2 = document.createElement("div")
el.appendChild(el2)
el2.style =
    "width:4px;height:4px;pointer-events:none;position:absolute;top:50%;left:50%;translate:-50% -50%;background:blue"

const mv = new Movable(el, {
    sx: 5,
    sy: 7,
    tx: 5,
    ty: 3,
})

el.addEventListener("pointerdown", (ev) => {
    el.setPointerCapture(ev.pointerId)
})

el.addEventListener("pointermove", (ev) => {
    const ol = mv.toLocal()
    const [x, y] = apply2(ol, [ev.offsetX, ev.offsetY])
})
