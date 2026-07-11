const now = Temporal.Now.instant()
    .toZonedDateTimeISO("America/Los_Angeles")
    .with({ nanosecond: 23 })

let initial = now
while (true) {
    const prev = initial.getTimeZoneTransition("previous")
    if (prev == null) break
    initial = prev
}
initial

if (
    initial.offsetNanoseconds
    == initial.subtract({ nanoseconds: 1 }).offsetNanoseconds
) {
    console.log("no tx")
}

const times: Temporal.ZonedDateTime[] = [initial]
while (true) {
    const next = initial.getTimeZoneTransition("next")
    if (next == null) break

    times.push((initial = next))
}
console.log(times)
