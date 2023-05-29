export function has<T>(array: readonly T[], item: unknown): item is T {
  return array.includes(item as any)
}
