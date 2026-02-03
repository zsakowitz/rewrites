// Draws a cool animation with points and lines connecting them.

const canvas = document.createElement("canvas")
canvas.width = innerWidth + 100
canvas.height = innerHeight + 100
canvas.style.display = "block"
canvas.style.position = "fixed"
canvas.style.width = `${canvas.width}px`
canvas.style.height = `${canvas.height}px`
canvas.style.left = "-50px"
canvas.style.top = "-50px"
document.body.prepend(canvas)

const ctx = canvas.getContext("2d")!
if (!ctx) {
    throw new Error("Failed to acquire canvas context.")
}

export class Point {
    static of(x: number, y: number) {
        const angle = Math.random() * 2 * Math.PI
        return new Point(x, y, Math.cos(angle) / 2, Math.sin(angle) / 2)
    }

    static random() {
        return Point.of(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
        )
    }

    constructor(
        public x: number,
        public y: number,
        public mx: number,
        public my: number,
    ) {}
}

const points: Point[] = []

for (let i = 0; i < canvas.width; i += 100) {
    for (let j = 0; j < canvas.height; j += 100) {
        points.push(Point.of(i, j))
    }
}

export function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const point of points) {
        for (const other of points) {
            const distance = Math.hypot(point.x - other.x, point.y - other.y)

            if (distance <= 100) {
                if (distance > 50) {
                    const darkness = ((distance - 50) / 50) * 256
                    ctx.strokeStyle = `rgb(${darkness} ${darkness} ${darkness})`
                } else {
                    ctx.strokeStyle = "black"
                }

                ctx.beginPath()
                ctx.moveTo(point.x, point.y)
                ctx.lineTo(other.x, other.y)
                ctx.stroke()
            }
        }
    }

    for (const point of points) {
        ctx.fillStyle = "black"
        ctx.strokeStyle = "transparent"
        ctx.beginPath()
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
        ctx.fill()

        point.x = mod(point.x + point.mx, canvas.width)
        point.y = mod(point.y + point.my, canvas.height)
    }
}

export function loop() {
    requestAnimationFrame(() => {
        draw()
        loop()
    })
}

loop()

/** A mod function that safely handles negative numbers. */
function mod(a: number, b: number) {
    return ((a % b) + b) % b
}
