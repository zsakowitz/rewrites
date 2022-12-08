// Calculates the inventory sequence as described in
// https://www.youtube.com/watch?v=rBU9E-ZOZAI.

export type Inventory = number[]

export function termCount<T>(array: readonly T[], item: T) {
  let count = 0

  array.forEach((value) => value === item && count++)

  return count
}

/** This function mutates its input array. */
export function takeInventory(sequence: number[]) {
  const inventory: Inventory = []
  let lastCount = -1

  for (let index = 0; lastCount != 0; index++) {
    lastCount = termCount(sequence, index)
    inventory.push(lastCount)
    sequence.push(lastCount)
  }

  return inventory
}

export function repeat(max: number) {
  const result: number[] = []
  const inventories: Inventory[] = []

  for (let index = 0; index < max; index++) {
    const next = takeInventory(result)
    inventories.push(next)
  }

  return { result, inventories }
}
