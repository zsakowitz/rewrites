// #::exclude

import { Sandpile } from "./sandpiles"

const pile = new Sandpile(40, 40)

pile[20]![20] = 2000

pile.toppleVisually(8)
