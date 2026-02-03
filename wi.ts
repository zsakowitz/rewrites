import { mu1, paths5, sakawi } from "./sakawi.js"

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
svg.setAttribute("width", "1202px")
svg.setAttribute("height", "535px")
svg.setAttribute("viewBox", "0 0 1202 535")
svg.setAttribute("style", "overflow:visible")

function trace(d: string, chars: string, size: number, offset = 1) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", d)
    path.setAttribute("style", "fill:transparent")

    document.body.appendChild(svg)
    svg.appendChild(path)

    const total = path.getTotalLength()
    const delta = total / (chars.length - offset)

    for (let i = 0; i < chars.length; i++) {
        const pos = i * delta
        const point = path.getPointAtLength(pos)

        const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text",
        )
        text.textContent = chars[i]!
        text.setAttribute("x", point.x + "")
        text.setAttribute("y", point.y + "")
        text.setAttribute(
            "style",
            `text-anchor:middle;alignment-baseline:central;font-size:${size}px`,
        )
        svg.appendChild(text)
    }
}

const hiragana =
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"
const katakana =
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"
const kanji =
    "一二三四五六七八九十月火水木金土日時分年半食飲大小新古見聞読書言話魚肉卵"
const base = hiragana
    .split("")
    .map((h, i) => h + katakana[i])
    .join("")
const chars1 = base + base.split("").reverse().join("")
const chars = hiragana + katakana + kanji

// trace(paths6.slice(0, 4).join(" "), hiragana, 12)
// trace(paths6.slice(4, 11).join(" "), katakana, 12)
// trace(paths6.slice(11, 18).join(" "), hiragana, 8)
// trace(paths6.slice(18).join(" "), katakana, 8)
// trace(paths6.slice(11).join(" "), hiragana + katakana, 10)
// trace(paths6.slice(11).join(" "), kanji.repeat(3), 8)

// trace(paths5.slice(0, 7).join(" "), hiragana, 10)
// trace(paths5.slice(7, 10).join(" "), katakana, 10)
// trace(paths5.slice(10).join(" "), kanji.slice(0, 25), 10)

trace(mu1.join(" "), hiragana, 20)

export {}
