import type { Creature } from "./creature"
import {
    brainFromGenome,
    genomeColor,
    genomeMutateInPlace,
    genomeRandom,
    type Genome,
    type Props,
} from "./genome"

const MAX = 0xffff

export class World {
    constructor(readonly props: Props) {
        const { sx, sy, creatureCount } = props
        this.map = new Uint16Array(sx * sy)
        this.map.fill(MAX)

        if (creatureCount >= MAX || creatureCount > (sx * sy) / 4) {
            throw new Error("too many creatures")
        }

        this.creatures = []

        for (let i = 0; i < creatureCount; i++) {
            this.addCreature(genomeRandom(props.genomeSize))
        }

        this.neurons = new Float64Array(
            this.props.ncInternal + this.props.ncAction,
        )
    }

    readonly map: Uint16Array
    creatures: Creature[]
    readonly neurons: Float64Array

    cv: HTMLCanvasElement | undefined
    ctx: CanvasRenderingContext2D | undefined
    label: HTMLElement | undefined

    getEmptyPos(): [number, number] {
        for (let i = 0; i < 100; i++) {
            const x = Math.floor(Math.random() * this.props.sx)
            const y = Math.floor(Math.random() * this.props.sy)

            if (this.map[y * this.props.sx + x] == MAX) {
                return [x, y]
            }
        }

        throw new Error("no")
    }

    addCreature(genome: Genome) {
        const [px, py] = this.getEmptyPos()

        this.creatures.push({
            px,
            py,
            dx: 0,
            dy: 0,
            genome,
            brain: brainFromGenome(genome, this.props),
        })

        this.map[py * this.props.sx + px] = this.creatures.length - 1
    }

    render() {
        const SCALE = 12

        const cv = (this.cv ??= document.createElement("canvas"))
        const ctx = (this.ctx ??= this.cv.getContext("2d")!)

        cv.width = this.props.sx * SCALE
        cv.height = this.props.sy * SCALE

        for (const el of this.creatures) {
            ctx.fillStyle = genomeColor(el.genome)
            ctx.beginPath()
            ctx.ellipse(
                el.px * SCALE + SCALE / 2,
                el.py * SCALE + SCALE / 2,
                SCALE / 2,
                SCALE / 2,
                0,
                0,
                2 * Math.PI,
            )
            ctx.fill()
        }

        const label = (this.label ??= document.createElement("p"))

        label.textContent = `gen ${this.props.gen} / age ${(this.props.age + "").padStart(4, "0")}`
    }

    getSensor(creature: Creature, sensorIndex: number): number {
        switch (sensorIndex) {
            case 0:
                return Math.random() * 2 - 1

            case 1:
                return -1

            case 2:
                return +1

            case 3:
                return 0

            default:
                return 0
        }
    }

    simulateCreature(self: Creature, index: number) {
        const nn = this.neurons
        nn.fill(0)

        for (const {
            srcIsSensor,
            src,
            dstIsAction,
            dst,
            weight,
        } of self.brain) {
            const sourceValue =
                srcIsSensor ?
                    this.getSensor(self, src)
                :   Math.tanh(nn[this.props.ncAction + src]!)

            const targetIndex = dstIsAction ? dst : dst + this.props.ncAction

            nn[targetIndex]! += weight * sourceValue
        }

        const actionMoveX = Math.tanh(nn[0]!)
        const actionMoveY = Math.tanh(nn[1]!)

        const mx =
            +(Math.random() < Math.abs(actionMoveX)) * Math.sign(actionMoveX)

        const my =
            +(Math.random() < Math.abs(actionMoveY)) * Math.sign(actionMoveY)

        self.dx = mx
        self.dy = my

        if (
            0 <= self.px + mx
            && 0 <= self.py + my
            && self.px + mx < this.props.sx
            && self.py + my < this.props.sy
            && this.map[(self.py + my) * this.props.sx + self.px + mx] == MAX
        ) {
            this.map[self.py * this.props.sx + self.px] = MAX
            self.px += mx
            self.py += my
            this.map[self.py * this.props.sx + self.px] = index
        }
    }

    step() {
        for (let i = 0; i < this.creatures.length; i++) {
            this.simulateCreature(this.creatures[i]!, i)
        }
        this.props.age++
    }

    preserve(f: (creature: Creature) => boolean) {
        const next: Creature[] = []

        this.creatures.forEach((creature) => {
            if (f(creature)) {
                next.push(creature)
                return
            }

            this.map[creature.py * this.props.sx + creature.px] = MAX
        })

        this.creatures = next
    }

    regenerate() {
        const parents = this.creatures

        this.creatures = []
        this.map.fill(MAX)
        this.props.gen++
        this.props.age = 0

        for (let i = 0; i < this.props.creatureCount; i++) {
            const parentIndex = Math.floor(Math.random() * parents.length)

            const childGenome = parents[parentIndex]!.genome.slice()
            genomeMutateInPlace(childGenome, this.props.mutationChancePerGene)

            this.addCreature(childGenome)
        }
    }
}
