import { Movable } from "./2d/movable"
import { apply2, inverse2 } from "./2d/tform"

const el = document.createElement("div")
el.style.backgroundColor = "#ffd0e0"
el.style.width = "320px"
el.style.height = "160px"
document.body.appendChild(el)

const mv = new Movable(el, {
    sx: 3,
    sy: 6,
    tx: 1,
    ty: 1,
})

el.addEventListener("pointerdown", (ev) => {
    el.setPointerCapture(ev.pointerId)
})

el.addEventListener("pointermove", (ev) => {
    const ol = inverse2(mv.toOffset())
    const [x, y] = apply2(ol, [ev.offsetX, ev.offsetY])
    console.log(x.toPrecision(2) + "\t" + y.toPrecision(2))
})
