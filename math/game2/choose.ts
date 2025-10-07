import { Grid } from "./rect"

// game is to pick some `true` bit, flip it, and, for each bit northeast of it, optionally flip it
export class Choose extends Grid {
  private allBits

  exec() {
    for (let x = 0; x < this.w; x++) {
      for (let y = 0; y < this.h; y++) {
        if (!this.get(x, y)) continue
      }
    }
  }
}
