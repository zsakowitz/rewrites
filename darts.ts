const start = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
]

export function score(data: number[]): number {
    let score = 0
    for (let i = 0; i < data.length; i++) {
        score += Math.abs(data[i]! - data[(i + 1) % data.length]!)
    }
    return score
}

export function randint(max: number): number {
    return Math.floor(max * Math.random())
}

export function go(
    data: number[],
    acceptChance = 0.3,
    count = 10000,
): { data: number[]; scores: number[]; i: number } {
    let a = 0
    let b = 0
    let temp = 0
    let next = 0
    let current = score(data)
    const scores: number[] = []

    let i = 0
    for (; i < count; i++) {
        a = randint(data.length)
        b = randint(data.length)
        // unconditionally accept sometimes
        if (Math.random() < acceptChance) {
            temp = data[b]!
            data[b] = data[a]!
            data[a] = temp
            current = score(data)
        } else {
            // check the new score
            temp = data[b]!
            data[b] = data[a]!
            data[a] = temp
            next = score(data)
            // if the score got smaller, undo the swap
            if (next < current) {
                temp = data[b]!
                data[b] = data[a]!
                data[a] = temp
            } else {
                // store the score
                current = next
            }
        }
        scores.push(current)
        if (current == 200) {
            return { data, scores, i }
        }
    }

    return { data, scores, i }
}
