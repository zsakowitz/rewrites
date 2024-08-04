import { createImmediateEffect, createSignal } from "./classes.js"

const [x, setX] = createSignal(23)
const [exitEarly, setExitEarly] = createSignal(false)

createImmediateEffect(() => {
  console.log("effect is running")
  if (exitEarly()) {
    console.log("exit early")
    return
  }
  console.log(x())
})

setX(78)
setX(56)
setExitEarly(true)
setX(48)
setX(98)
setX(90)
