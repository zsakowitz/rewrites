import {
  ReadonlySchedule,
  ScheduleItem,
  endOfSleep,
  startOfSleep,
} from "./constants"
import { Time } from "./time"

let blockDate = 0

function createRandomItem(): ScheduleItem {
  if (Math.random() < 0.25 && blockDate < 7) {
    const [start, end] = Time.randomRange(endOfSleep, startOfSleep)

    blockDate++

    return {
      type: "blocked-period",
      label: "",
      start: start.toDate(new Date()),
      end: end.toDate(new Date()),
    }
  }

  const length = Math.floor(Math.random() * 8) * 15 + 15

  const urgency = Math.floor(Math.random() * 4) + 1

  const deadlineUrgency =
    Math.random() < 0.5 ? undefined : Math.random() < 0.5 ? "soft" : "hard"

  const deadline = new Date(
    Date.now() + 2 * dayLength + dayLength * Math.random() * 7
  )
}

export const schedule: ReadonlySchedule = [
  ...createTasks(15),
  ...createTasks(16),
  ...createTasks(17),
  ...createTasks(18),
  ...createTasks(19),
  ...createTasks(20),
  ...createTasks(21),
  {
    type: "task",
    label: "Duolingo",
    length: 15,
    urgency: 1,
    deadline: {
      type: "deadline",
      urgency: "hard",
      date: new Date(2023, 2, 16),
    },
  },
  {
    type: "task",
    label: "SFCJL Essay",
    length: 60,
    urgency: 3,
    deadline: {
      type: "deadline",
      urgency: "hard",
      date: new Date(2023, 2, 17, 8),
    },
  },
]
