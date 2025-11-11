import { Group } from "./group"

export interface El {
  rev: boolean
  which: number
}

export class D extends Group<El> {
  constructor(readonly n: number) {
    super()
  }

  id(): El {
    return { rev: false, which: 0 }
  }

  inv(el: El): El {}
}
