import { Cv } from "./cv"
import { branches } from "./scene/trees"

const cv = new Cv()
document.body.appendChild(cv.el)
cv.queue()
cv.moveTo(0, 0, 2000)

cv.push(branches())
