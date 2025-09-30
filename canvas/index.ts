import { Cv } from "./cv"
import { branches } from "./scene/trees"

const cv = new Cv()
document.body.appendChild(cv.el)
cv.queue()
cv.moveTo(750, 199, 0.01)

cv.push(branches())
