// A typed event emitter that uses promises and async iterables instead of
// callbacks to manage event listeners. #events #promise #rewrite

export class Emitter<T extends EventMap = EventMap> {
    readonly listeners = new Map<string, Set<(data: any) => void> | undefined>()

    once<K extends keyof T & string>(event: K) {
        return new Promise<Parameters<T[K]>[0]>((resolve) => {
            const listeners = this.listeners.get(event) || new Set()
            this.listeners.set(event, listeners)

            listeners.add(function get(data) {
                listeners.delete(get)
                resolve(data)
            })
        })
    }

    async *on<K extends keyof T & string>(event: K) {
        try {
            while (true) {
                yield await this.once(event)
            }
        } finally {
            if (this.listeners.get(event)?.size === 0) {
                this.listeners.delete(event)
            }
        }
    }

    emit<K extends keyof T & string>(event: K, ...data: Parameters<T[K]>) {
        this.listeners
            .get(event)
            ?.forEach((fn) => (fn as any)(...(data as any)))
    }
}

export type EventMap = Record<string, (data?: any) => void>
