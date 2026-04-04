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
type Genome = Uint32Array

function genomeRandom(size: number): Genome {
    const genome = new Uint32Array(size)
    crypto.getRandomValues(genome)
    return genome
}

function genomeMutateInPlace(genome: Genome, mutationChancePerGene: number) {
    for (let i = 0; i < genome.length; i++) {
        if (Math.random() > mutationChancePerGene) {
            continue
        }

        genome[i]! ^= 1 << Math.floor(Math.random() * 32)
    }
}

/** An interpreted form of `Genome`, with all fields decomposed. */
interface BrainInst {
    srcIsSensor: boolean
    src: number

    dstIsAction: boolean
    dst: number

    weight: number
}

function brainInstToString(inst: BrainInst): string {
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

type Brain = BrainInst[]

interface NeuronCount {
    sensor: number
    internal: number
    action: number
}

function brainFromGenome(genome: Genome, count: NeuronCount): Brain {
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

function brainToString(brain: Brain): string {
    return brain.map(brainInstToString).join("\n")
}

interface Creature {
    px: number
    py: number
    genome: Genome
    brain: Brain
}
