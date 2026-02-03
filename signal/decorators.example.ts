// #::exclude

import { memo, signal } from "./decorators.js"

export class Adder {
    @signal
    accessor x = 0

    @signal
    accessor y = 0

    @memo
    get sum() {
        return this.x + this.y
    }
}
