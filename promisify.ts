// A typed promisify function. #promise #rewrite

function promisify<I extends any[], O>(
    func: (...args: [...args: I, cb: (err: unknown, value: O) => void]) => void,
) {
    return (...args: I) => {
        return new Promise<O>((resolve, reject) => {
            func(...args, (err: unknown, value: O) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(value)
                }
            })
        })
    }
}

let e = promisify((a: number, c: number, cb: (err: any, value: 23) => void) => {
    cb(0, 23)
})

export {}
