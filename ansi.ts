export const ANSI = {
  black: "\x1b[30m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  white: "\x1b[37m",
  yellow: "\x1b[33m",

  dim: "\x1b[2m",
  strikethrough: "\x1b[9m",

  cycle(colors: string[]) {
    return (n: number) => colors[n % colors.length] ?? ""
  },
  get cycleAll() {
    return this.cycle([
      ANSI.blue,
      ANSI.cyan,
      ANSI.green,
      ANSI.magenta,
      ANSI.red,
      ANSI.yellow,
    ])
  },
} as const
