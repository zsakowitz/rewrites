import { World } from "./world"

const world = new World({
    creatureCount: 1024,
    genomeSize: 4,
    gen: 0,
    age: 0,
    mutationChancePerGene: 0.001,

    sx: 128,
    sy: 128,

    ncSensor: 4,
    ncInternal: 1,
    ncAction: 4,
})

world.cv = document.getElementById("world-cv") as HTMLCanvasElement
world.label = document.getElementById("world-label")!
world.render()

document.getElementById("btn-next")!.onclick = () => {
    world.step()
    world.render()
}

document.getElementById("btn-start")!.onclick = async () => {
    for (let i = 0; i < 300; i++) {
        world.step()
        world.render()
        await wait(1000 / 30)
    }
}

document.getElementById("btn-start-quick")!.onclick = async () => {
    for (let i = 0; i < 300; i++) {
        world.step()
        world.render()
        await wait(0)
    }
}

document.getElementById("btn-kill-left")!.onclick = () => {
    world.preserve((c) => c.px >= world.props.sx / 2)
    world.render()
}

document.getElementById("btn-kill-right")!.onclick = () => {
    world.preserve((c) => c.px <= world.props.sx / 2)
    world.render()
}

document.getElementById("btn-reproduce")!.onclick = () => {
    world.regenerate()
    world.render()
}

export function wait(n: number) {
    return new Promise((r) => setTimeout(r, n))
}
