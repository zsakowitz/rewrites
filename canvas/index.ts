import { Cv } from "./cv"
import { branches } from "./scene/trees"

const cv = new Cv()
document.body.appendChild(cv.el)
cv.queue()
cv.moveTo(750, -150, 1000)

cv.push(branches())
