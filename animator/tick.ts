// A tick function that resolves after calling `requestAnimationFrame`.

export function tick(): Promise<DOMHighResTimeStamp> {
    return new Promise((resolve) => requestAnimationFrame(resolve))
}
