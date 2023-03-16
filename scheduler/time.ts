export class Time {
  static random(start: Time, end: Time): Time {
    const startMin = start.hour * 60 + start.minute
    const endMin = end.hour * 60 + end.minute

    const time = Math.floor(Math.random() * (endMin - startMin) + startMin)

    return new Time(Math.floor(time / 60), time % 60)
  }

  static randomRange(start: Time, end: Time): [Time, Time] {
    const middle = Time.random(start, end)
    return [Time.random(start, middle), Time.random(middle, end)]
  }

  constructor(readonly hour: number, readonly minute: number) {}

  toDate(baseDate: Date): Date

  toDate(date: number, monthIndex: number, year: number): Date

  toDate(year: number | Date, monthIndex?: number, date?: number): Date {
    if (year instanceof Date) {
      monthIndex = year.getMonth()
      date = year.getDate()
      year = year.getFullYear()
    }

    return new Date(year, monthIndex ?? 0, date, this.hour, this.minute)
  }

  toString() {
    return this.hour + ":" + this.minute.toString().padStart(2, "0")
  }
}
