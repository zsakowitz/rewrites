const cv = document.createElement("canvas")
const ctx = cv.getContext("2d")!
document.body.appendChild(cv)
cv.style =
    "width:100vw;height:100vh;position:fixed;top:0;left:0;background:#ddd;touch-action:none"

const box = document.createElement("div")
box.style =
    "position:fixed;top:1em;left:1em;white-space:pre;font-family:monospace"
document.body.appendChild(box)

cv.addEventListener("pointerdown", (ev) => {})

cv.addEventListener("pointermove", (ev) => {
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
`.trim()

    cv.width = devicePixelRatio * cv.clientWidth
    cv.height = devicePixelRatio * cv.clientHeight
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.clearRect(0, 0, cv.width, cv.height)

    const w = 64 * (0.25 + Math.sin(Math.abs(ev.tiltX) * (Math.PI / 180)))
    const h = 64 * (0.25 + Math.sin(Math.abs(ev.tiltY) * (Math.PI / 180)))
    ctx.beginPath()
    ctx.fillStyle = "black"
    ctx.ellipse(ev.offsetX, ev.offsetY, w, h, 0, 0, 2 * Math.PI)
    ctx.fill()

    for (const el of ev.getPredictedEvents()) {
        ctx.beginPath()
        ctx.fillStyle = "red"
        ctx.ellipse(el.clientX, el.clientY, 4, 4, 0, 0, 2 * Math.PI)
        ctx.fill()
    }
})

cv.addEventListener("pointerrawupdate", (ev) => {})
