import { Movable } from "./2d/movable"
import { apply2 } from "./2d/tform"

const el = document.createElement("div")
el.style = "background:#ffd0e0;position:fixed;inset:0"
document.body.appendChild(el)

const el2 = document.createElement("div")
el.appendChild(el2)
el2.style =
    "width:4px;height:4px;pointer-events:none;position:absolute;top:50%;left:50%;translate:-50% -50%;background:blue"

const mv = new Movable(el, {
    sx: 2,
    sy: 1,
    tx: 3,
    ty: 7,
})

setInterval(() => {
    const { lo } = mv
    const [x, y] = apply2(lo, [3, 7])
    el2.style.left = x + "px"
    el2.style.top = y + "px"
    el2.style.width = lo.sx + "px"
    el2.style.height = -lo.sy + "px"
})

el.addEventListener("wheel", (ev) => {
    mv.handleEvent(ev)
})
