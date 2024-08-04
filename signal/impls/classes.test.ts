import { immediateEffect, signal } from "./classes.js"

const [x, setX] = signal(23)
const [exitEarly, setExitEarly] = signal(false)

immediateEffect(() => {
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
