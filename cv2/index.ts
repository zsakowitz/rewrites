import { Movable } from "./2d/movable"
import { apply2 } from "./2d/tform"

const el = document.createElement("div")
el.style = "background:#ffd0e0;position:fixed;inset:0;touch-action:none"
document.body.appendChild(el)

const el2 = document.createElement("div")
el.appendChild(el2)
el2.style =
    "width:4px;height:4px;pointer-events:none;position:absolute;top:50%;left:50%;translate:-50% -50%;background:blue;touch-action:none"

const mv = new Movable(el, {
    sx: 10,
    sy: 10,
    tx: 0,
    ty: 0,
})

setInterval(() => {
    const { lo } = mv
    const [x, y] = apply2(lo, [0, 0])
    el2.style.left = x + "px"
    el2.style.top = y + "px"
    el2.style.width = lo.sx + "px"
    el2.style.height = -lo.sy + "px"
})

el.addEventListener("wheel", mv, { passive: false })
el.addEventListener("pointerdown", mv, { passive: true })
el.addEventListener("pointermove", mv, { passive: true })
el.addEventListener("pointerup", mv, { passive: true })
el.addEventListener("pointercancel", mv, { passive: true })
