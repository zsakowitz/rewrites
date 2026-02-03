const el = document.getElementById("rule") as HTMLInputElement
const cv = document.getElementById("cv") as HTMLCanvasElement
const ctx = cv.getContext("2d")!

const RATIO = 8
addEventListener("resize", render)

function render() {
    const rule = {
        0b000: +el.value & 0b00000001 ? 1 : 0,
        0b001: +el.value & 0b00000010 ? 1 : 0,
        0b010: +el.value & 0b00000100 ? 1 : 0,
        0b011: +el.value & 0b00001000 ? 1 : 0,
        0b100: +el.value & 0b00010000 ? 1 : 0,
        0b101: +el.value & 0b00100000 ? 1 : 0,
        0b110: +el.value & 0b01000000 ? 1 : 0,
        0b111: +el.value & 0b10000000 ? 1 : 0,
    } as const
    const w = (cv.width = Math.ceil(cv.clientWidth / RATIO))
    const h = (cv.height = Math.ceil(cv.clientHeight / RATIO))
    let prev = Array.from({ length: 2 * h + 2 }, (_, i) => (i == h + 1 ? 1 : 0))
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < prev.length; j++) {
            if (prev[j]) {
                ctx.fillRect(j, i, 1, 1)
            }
        }
        prev = prev.map((_, i) => {
            const n = (prev[i - 1] ?? 0) * 4 + prev[i]! * 2 + (prev[i + 1] ?? 0)
            return rule[n as keyof typeof rule]
        })
    }
}
render()
