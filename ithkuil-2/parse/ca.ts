import type { PartialCA } from "@zsnout/ithkuil"

export function parseCa(ca: string): PartialCA {
  // TODO: Implement a better Ca parser than just guessing :)

  return {
    affiliation: "CSL",
    configuration: "UPX",
    extension: "DEL",
    perspective: "M",
    essence: "NRM",
  }
}
