const cv = document.createElement("canvas")
const cv2 = document.createElement("canvas")
const ctx = cv.getContext("2d")!
const ctx2 = cv2.getContext("2d")!
document.body.appendChild(cv)
document.body.appendChild(cv2)
cv.style = cv2.style =
    "width:100vw;height:100vh;position:fixed;top:0;left:0;background:#ddd;touch-action:none"
cv2.style.pointerEvents = "none"
cv2.style.background = "none"

const box = document.createElement("div")
box.style =
    "position:fixed;top:1em;left:1em;white-space:pre;font-family:monospace;user-select:none;pointer-events:none"
document.body.appendChild(box)

const x: Record<number, number | null> = Object.create(null)
const y: Record<number, number | null> = Object.create(null)

cv.addEventListener("pointermove", (ev) => {
    if (x[ev.pointerId] == null) return

    const ay = ev.offsetY - y[ev.pointerId]!
    const ax = ev.offsetX - x[ev.pointerId]!
    if (ay == 0 && ax == 0) return

    box.textContent = `
time               ${Date.now()}
pointerId          ${ev.pointerId}
pointerType        ${ev.pointerType}

offsetX            ${ev.offsetX}
offsetY            ${ev.offsetY}
width              ${ev.width}
height             ${ev.height}

altitudeAngle      ${ev.altitudeAngle}
azimuthAngle       ${ev.azimuthAngle}
pressure           ${ev.pressure}
tangentialPressure ${ev.tangentialPressure}
tiltX              ${ev.tiltX}
tiltY              ${ev.tiltY}
twist              ${ev.twist}
`.trimStart()

    if (
        cv.width != devicePixelRatio * cv.clientWidth
        || cv.height != devicePixelRatio * cv.clientHeight
    ) {
        ctx.resetTransform()
        ctx2.resetTransform()

        cv.width = devicePixelRatio * cv.clientWidth
        cv.height = devicePixelRatio * cv.clientHeight
        ctx.scale(devicePixelRatio, devicePixelRatio)

        cv2.width = devicePixelRatio * cv.clientWidth
        cv2.height = devicePixelRatio * cv.clientHeight
        ctx2.scale(devicePixelRatio, devicePixelRatio)
    }

    for (const el of ev.getCoalescedEvents()) {
        ctx.beginPath()
        ctx.lineWidth = 4
        ctx.lineCap = "round"
        ctx.strokeStyle = "black"
        ctx.moveTo(x[el.pointerId]!, y[el.pointerId]!)
        ctx.lineTo(
            (x[el.pointerId] = el.offsetX),
            (y[el.pointerId] = el.offsetY),
        )
        ctx.stroke()
    }

    ctx2.clearRect(0, 0, cv.clientWidth, cv.clientHeight)
    let px = x[ev.pointerId] ?? ev.offsetX
    let py = y[ev.pointerId] ?? ev.offsetY
    for (const el of ev.getPredictedEvents()) {
        ctx2.beginPath()
        ctx2.lineWidth = 4
        ctx2.lineCap = "round"
        ctx2.strokeStyle = "black"
        ctx2.moveTo(px, py)
        ctx2.lineTo((px = el.offsetX), (py = el.offsetY))
        ctx2.stroke()
    }
})

cv.addEventListener("pointerup", (ev) => {
    box.textContent = "pointerup"

    ctx2.clearRect(0, 0, cv.clientWidth, cv.clientHeight)
    x[ev.pointerId] = null
    y[ev.pointerId] = null
})

cv.addEventListener("pointerdown", (ev) => {
    box.textContent = "pointerdown"

    x[ev.pointerId] = ev.offsetX
    y[ev.pointerId] = ev.offsetY
})

box.textContent = "not down"
