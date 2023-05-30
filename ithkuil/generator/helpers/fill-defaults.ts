export function fillDefaults<T>(defaultValue: T, additions: Partial<T>): T {
  const output = { ...defaultValue }

  for (const key in additions) {
    const value = additions[key]

    if (value != null) {
      output[key] = value
    }
  }

  return output
}
