import { GameEq } from ".."

export class Nim extends GameEq<number> {
    constructor(public size: number) {
        super()
    }

    moves(): readonly number[] {
        const ret = []
        for (let i = 0; i < this.size; i++) {
            ret.push(i + 1)
        }
        return ret
    }

    move(mv: number): void {
        this.size -= mv
    }

    undo(mv: number): void {
        this.size += mv
    }
}
