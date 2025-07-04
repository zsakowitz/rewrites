import { Meowbox } from "./meowbox"

export interface SolveRequest {
  id: number
  cells: Uint8Array
  rows: number
  cols: number
}

export type SolvedMeowbox = ReturnType<typeof solve>

export function solve(message: SolveRequest) {
  const now = Date.now()
  const box = new Meowbox(message.cells, message.rows, message.cols)
  box.untangle()
  return {
    id: message.id,
    count: box.countSolutions(),
    soln: box.readSolution() ?? new Uint8Array(),
    time: Date.now() - now,
  }
}

// onmessage = (ev) => {
// postMessage(solve(ev.data as SolveRequest))
// }

// declare module "." {
//   const url: string
//   export default url
// }
