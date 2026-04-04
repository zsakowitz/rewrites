//! Based on https://www.youtube.com/watch?v=N3tRFayqVtk

/**
 * A raw uninterpreted genome.
 *
 * Each `u32` represents a source, target, and weight, as follows:
 *
 * - `u01` source kind (0 internal, 1 sensory)
 * - `u07` source index (modulo number of sources)
 * - `u01` target kind (0 internal, 1 action)
 * - `u07` target index (modulo number of actions)
 * - `u16` connection weight, interpreted as `[-4..4)`
 */
export type Genome = Uint32Array

export function genomeRandom(size: number): Genome {
    const genome = new Uint32Array(size)
    crypto.getRandomValues(genome)
    return genome
}

export function genomeMutateInPlace(
    genome: Genome,
    mutationChancePerGene: number,
) {
    for (let i = 0; i < genome.length; i++) {
        if (Math.random() > mutationChancePerGene) {
            continue
        }

        genome[i]! ^= 1 << Math.floor(Math.random() * 32)
    }
}

function genomeColorR(genome: Genome) {
    const front = genome[0]!
    const back = genome.at(-1)!

    return (
        (genome.length & 1)
        | (+((front & 0x8000_0000) != 0) << 1)
        | (+((back & 0x8000_0000) != 0) << 2)
        | (+((front & 0x0080_0000) != 0) << 3)
        | (+((back & 0x0080_0000) != 0) << 4)
        | (((front & 0x0100_0000) >> 24) << 5)
        | (((front & 0x0001_0000) >> 16) << 6)
        | (((back & 0x0100_0000) >> 24) << 7)
    )
}

function rgbToLuma(r: number, g: number, b: number) {
    return (r + r + r + b + g + g + g + g) / 8
}

export function genomeColor(genome: Genome) {
    let r = genomeColorR(genome)
    let g = ((r & 0x1f) << 3) & 0xff
    let b = ((r & 7) << 5) & 0xff

    const maxColorVal = 0xb0
    const maxLumaVal = 0xb0

    if (rgbToLuma(r, g, b) > maxLumaVal) {
        if (r > maxColorVal) r %= maxColorVal
        if (g > maxColorVal) g %= maxColorVal
        if (b > maxColorVal) b %= maxColorVal
    }

    return (
        "#"
        + r.toString(16).padStart(2, "0")
        + g.toString(16).padStart(2, "0")
        + b.toString(16).padStart(2, "0")
    )
}

/** An interpreted form of `Genome`, with all fields decomposed. */
export interface BrainInst {
    srcIsSensor: boolean
    src: number

    dstIsAction: boolean
    dst: number

    weight: number
}

export function brainInstToString(inst: BrainInst): string {
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

export type Brain = BrainInst[]

export interface Props {
    creatureCount: number
    genomeSize: number
    gen: number
    age: number
    mutationChancePerGene: number

    // world map size
    sx: number
    sy: number

    // number of each neuron available
    ncSensor: 4
    ncInternal: number
    ncAction: 4
}

export function brainFromGenome(genome: Genome, count: Props): Brain {
    const brain: Brain = []

    for (let i = 0; i < genome.length; i++) {
        const el = genome[i]!
        const srcIsSensor = (el & 0x8000_0000) != 0
        const dstIsAction = (el & 0x0080_0000) != 0

        brain.push({
            srcIsSensor,
            src:
                ((el & 0x7f00_0000) >> 24)
                % (srcIsSensor ? count.ncSensor : count.ncInternal),
            dstIsAction,
            dst:
                ((el & 0x007f_0000) >> 16)
                % (dstIsAction ? count.ncAction : count.ncInternal),
            weight: (4 / 0x8000) * ((el & 0x0000_ffff) - 0x8000),
        })
    }

    brain.sort((a, b) => +a.dstIsAction - +b.dstIsAction)
    brain.sort((a, b) => +b.srcIsSensor - +a.srcIsSensor)

    return brain
}

export function brainToString(brain: Brain): string {
    return brain.map(brainInstToString).join("\n")
}
