import { brainToDigraph, type Props } from "./genome"
import { SCALE, World } from "./world"

const props: Props = {
    creatureCount: 1024,
    genomeSize: 16,
    gen: 0,
    age: 0,
    ageMax: 300,
    mutationChancePerGene: 0.001,

    sx: 128,
    sy: 128,

    ncInternal: 4,
}

interface RestrictedCreature {
    px: number
    py: number
}

const CRITERIA: Record<string, (creature: RestrictedCreature) => number> = {
    __proto__: null!,
    corners(c) {
        return (
                Math.hypot(c.px, c.py) < 20
                    || Math.hypot(props.sx - c.px, c.py) < 20
                    || Math.hypot(c.px, props.sy - c.py) < 20
                    || Math.hypot(props.sx - c.px, props.sy - c.py) < 20
            ) ?
                1
            :   0
    },
    "right half survives"(c) {
        return c.px > world.props.sx / 2 ? 1 : 0
    },
    "right half preferred"(c) {
        return c.px / world.props.sx
    },
    "circle of radius 30 at center"(c) {
        return (
                Math.hypot(c.px - world.props.sx / 2, c.py - world.props.sy / 2)
                    < 30
            ) ?
                1
            :   0
    },
    "circle of radius 30 at slight left"(c) {
        return (
                Math.hypot(
                    c.px - world.props.sx / 2 - 20,
                    c.py - world.props.sy / 2,
                ) < 30
            ) ?
                1
            :   0
    },
    "sine wave"(c) {
        return Math.sin(c.px / 20) * Math.cos(c.py / 20)
    },
}

let activeKey = Object.keys(CRITERIA)[0]!
let activeVal = Object.values(CRITERIA)[0]!

const world = new World(props)
world.cv = document.getElementById("world-cv") as HTMLCanvasElement
world.label = document.getElementById("world-label")!
world.prerender = () => {
    const SIZE = 1
    for (let px = 0; px < world.props.sx; px += SIZE) {
        for (let py = 0; py < world.props.sy; py += SIZE) {
            const rc: RestrictedCreature = { px, py }
            const pc =
                255 - Math.round(Math.min(1, Math.max(0, activeVal(rc))) * 64)
            const red = pc.toString(16).padStart(2, "0")
            world.ctx!.fillStyle = "#" + "ffff" + red
            world.ctx!.fillRect(
                px * SCALE,
                py * SCALE,
                SIZE * SCALE,
                SIZE * SCALE,
            )
        }
    }
}
world.render()

document.getElementById("btn-next")!.onclick = () => {
    world.step()
    world.render()
}

document.getElementById("btn-start")!.onclick = async () => {
    for (let i = 0; i < props.ageMax; i++) {
        world.step()
        world.render()
        await wait(1000 / 30)
    }
}

document.getElementById("btn-run-1")!.onclick = async () => {
    world.preserve(activeVal)
    world.regenerate()

    for (let i = 0; i < props.ageMax; i++) {
        world.step()
        world.render()
        await wait(0)
    }
}

document.getElementById("btn-instant-100")!.onclick = () => {
    console.time()
    for (let i = 0; i < 100; i++) run()
    console.timeEnd()
    world.render()
}

document.getElementById("btn-kill")!.onclick = () => {
    world.preserve(activeVal)
    world.render()
}

document.getElementById("btn-reproduce")!.onclick = () => {
    world.regenerate()
    world.render()
}

export function wait(n: number) {
    return new Promise((r) => setTimeout(r, n))
}

function run() {
    world.preserve(activeVal)
    world.regenerate()

    for (let i = 0; i < props.ageMax; i++) {
        world.step()
    }
}

document.getElementById("btn-cycle-1")!.onclick = async () => {
    run()
    world.render()
}

document.getElementById("btn-cycle-10")!.onclick = async () => {
    for (let i = 0; i < 10; i++) run()
    world.render()
}

document.getElementById("btn-cycle-100")!.onclick = async () => {
    for (let i = 0; i < 100; i++) {
        run()
        world.render()
        await wait(1000 / 10)
    }
    world.render()
}

const brain = document.getElementById("creature-brain")!

world.cv!.onpointermove = async (ev) => {
    const px = Math.floor((ev.offsetX / world.cv!.clientWidth) * world.props.sx)
    const py = Math.floor(
        (ev.offsetY / world.cv!.clientHeight) * world.props.sy,
    )

    world.highlightedCreature =
        world.map[py * world.props.sx + px] == 0xffff ?
            undefined
        :   world.map[py * world.props.sx + px]!

    if (world.highlightedCreature == null) {
        brain.textContent = "no selection"
    } else {
        const el = await brainToDigraph(
            world.creatures[world.highlightedCreature]!.brain,
        )

        while (brain.firstChild) brain.firstChild.remove()

        brain.appendChild(el)
    }

    world.render()
}

const s = document.getElementById("select-criterion") as HTMLSelectElement

for (const k of Object.keys(CRITERIA)) {
    s.appendChild(new Option(k, k, k == activeKey))
}

s.oninput = s.onchange = () => {
    activeVal = CRITERIA[s.value]!
    world.render()
}
