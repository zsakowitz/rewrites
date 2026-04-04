import type { Creature } from "./creature"
import { brainToString, type Props } from "./genome"
import { World } from "./world"

const props: Props = {
    creatureCount: 1024,
    genomeSize: 8,
    gen: 0,
    age: 0,
    mutationChancePerGene: 0.001,

    sx: 128,
    sy: 128,

    ncInternal: 4,
}

const world = new World(props)
world.cv = document.getElementById("world-cv") as HTMLCanvasElement
world.label = document.getElementById("world-label")!
world.render()

document.getElementById("btn-next")!.onclick = () => {
    world.step()
    world.render()
}

document.getElementById("btn-start")!.onclick = async () => {
    for (let i = 0; i < MAX_AGE; i++) {
        world.step()
        world.render()
        await wait(1000 / 30)
    }
}

document.getElementById("btn-start-quick")!.onclick = async () => {
    for (let i = 0; i < MAX_AGE; i++) {
        world.step()
        world.render()
        await wait(0)
    }
}

document.getElementById("btn-kill")!.onclick = () => {
    world.preserve(survivalProbability)
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
    world.preserve(survivalProbability)
    world.regenerate()

    for (let i = 0; i < MAX_AGE; i++) {
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
        await wait(0)
    }
    world.render()
}

const brain = document.getElementById("creature-brain")!

world.cv!.onpointermove = (ev) => {
    const px = Math.floor((ev.offsetX / world.cv!.clientWidth) * world.props.sx)
    const py = Math.floor(
        (ev.offsetY / world.cv!.clientHeight) * world.props.sy,
    )

    world.highlightedCreature =
        world.map[py * world.props.sx + px] == 0xffff ?
            undefined
        :   world.map[py * world.props.sx + px]!

    if (world.highlightedCreature == undefined) {
        brain.textContent = "no selection"
    } else {
        brain.textContent = brainToString(
            world.creatures[world.highlightedCreature]!.brain,
        )
    }

    world.render()
}

function survivalProbability(creature: Creature): number {
    return creature.px / world.props.sx
}

const MAX_AGE = 300
