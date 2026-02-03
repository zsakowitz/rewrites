// #::exclude

import { Time } from "./time.js"

export interface Deadline {
    readonly type: "deadline"
    readonly date: Date
    readonly urgency: "hard" | "soft"
}

export interface Task {
    readonly type: "task"
    readonly label: string
    readonly length: number
    readonly urgency: 1 | 2 | 3 | 4
    readonly deadline?: Deadline
}

export interface BlockedPeriod {
    readonly type: "blocked-period"
    readonly label: string
    readonly start: Date
    readonly end: Date
}

export type ScheduleItem = Task | BlockedPeriod

export type Schedule = ScheduleItem[]
export type ReadonlySchedule = readonly ScheduleItem[]

export const endOfSleep = new Time(6, 0)
export const startOfSleep = new Time(21, 0)
