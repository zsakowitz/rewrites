import type { Object } from "./object"

export interface EventsObjectInteractor {
    onObjectInteraction(): void
}

export interface InteractionHandler<T, U extends {}> {
    init(screen: Screen, ev: PointerEvent, self: T): U | null
    move(screen: Screen, ev: PointerEvent, self: T, data: U): boolean // return false for "no update"
    commit(screen: Screen, ev: PointerEvent, self: T, data: U): void
    cancel(screen: Screen, ev: PointerEvent, self: T, data: U): void
}

interface Item {
    pid: number
    object: Object
}

export class ObjectInteractor {
    #pointers = new Map<number, Item>()
    #objects = new Map<Object, Item>()
    #events

    constructor(events: EventsObjectInteractor) {
        this.#events = events
    }
}
