import type { Brain, Genome } from "./genome"

export interface Creature {
    // current position; must be synced with global position array
    px: number
    py: number

    // last movement direction; each coordinate is [-1,1]
    dx: number
    dy: number

    genome: Genome
    brain: Brain
}
