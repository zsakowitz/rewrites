export type Nimber = number

export function mex(args: Nimber[]): Nimber {
    for (let i = 0; ; i++) {
        if (args.includes(i)) {
            continue
        }
        return i
    }
}
