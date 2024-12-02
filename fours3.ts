function partitions(parts: number, total: number): number[][] {
  if (parts == 1) {
    return [[total]]
  }

  if (parts == 2) {
    // prettier-ignore
    switch (total) {
      case 2: return [[1,1]]
      case 3: return [[1,2],[2,1]]
      case 4: return [[1,3],[2,2],[3,1]]
      case 5: return [[1,4],[2,3],[3,2],[4,1]]
      case 6: return [[1,5],[2,4],[3,3],[4,2],[5,1]]
      case 7: return [[1,6],[2,5],[3,4],[4,3],[5,2],[6,1]]
      case 8: return [[1,7],[2,6],[3,5],[4,4],[5,3],[6,2],[7,1]]
      case 9: return [[1,8],[2,7],[3,6],[4,5],[5,4],[6,3],[7,2],[8,1]]
    }
  }

  throw new Error("Invalid partition.")
}
