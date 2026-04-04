interface Creature {
    px: number
    py: number
    genome: Genome
    brain: Brain
}

type Genome = Uint32Array // each u32 represents source(u8) target(u8) weight(u16)

interface Inst {
    srcIsSensor: boolean
    src: number

    dstIsAction: boolean
    dst: number

    weight: number
}

type Brain = Inst[]

interface NeuronCount {
    sensor: number
    internal: number
    action: number
}

function randomGenome(size: number): Genome {
    const genome = new Uint32Array(size)
    crypto.getRandomValues(genome)
    return genome
}

function toBrain(genome: Genome, count: NeuronCount): Brain {
    const brain: Brain = []

    for (let i = 0; i < genome.length; i++) {
        const el = genome[i]!
        const srcIsSensor = (el & 0x8000_0000) != 0
        const dstIsAction = (el & 0x0080_0000) != 0

        brain.push({
            srcIsSensor,
            src:
                ((el & 0x7f00_0000) >> 24)
                % (srcIsSensor ? count.sensor : count.internal),
            dstIsAction,
            dst:
                ((el & 0x007f_0000) >> 16)
                % (dstIsAction ? count.action : count.internal),
            weight: (4 / 0x8000) * ((el & 0x0000_ffff) - 0x8000),
        })
    }

    brain.sort((a, b) => +a.dstIsAction - +b.dstIsAction)
    brain.sort((a, b) => +b.srcIsSensor - +a.srcIsSensor)

    return brain
}

function instToString(inst: Inst): string {
    return (
        (inst.srcIsSensor ? "S-" : "N-")
        + inst.src.toString(16).padStart(2, "0")
        + " "
        + ((inst.dstIsAction ? "A-" : "N-")
            + inst.dst.toString(16).padStart(2, "0"))
        + " "
        + (inst.weight > 0 ? "+" : "")
        + inst.weight.toFixed(4)
    )
}

function brainToString(brain: Brain): string {
    return brain.map(instToString).join("\n")
}

function mutate(genome: Genome, mutationChancePerGene: number) {
    for (let i = 0; i < genome.length; i++) {
        if (Math.random() > mutationChancePerGene) {
            continue
        }

        genome[i]! ^= 1 << Math.floor(Math.random() * 32)
    }
}
