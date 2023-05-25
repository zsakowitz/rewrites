export function joinWithSlashes(items: string[]) {
  return items.filter((x) => x != "").join("/")
}

export function joinWithHyphens(items: string[]) {
  return items.filter((x) => x != "").join("-")
}
