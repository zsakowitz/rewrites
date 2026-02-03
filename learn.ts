import {
    FSRS,
    Grades,
    Rating,
    State,
    createEmptyCard,
    generatorParameters,
    type Card,
    type Grade,
    type RecordLog,
    type ReviewLog,
} from "ts-fsrs"

const params = generatorParameters({ enable_fuzz: true })

const f = new FSRS(params)

const card = createEmptyCard(
    undefined,
    (c): CardUnchecked => ({ ...c, cid: crypto.randomUUID() }),
)

interface CardUnchecked extends Omit<Card, "due" | "last_review" | "state"> {
    cid: string
    due: Date | number
    last_review?: Date | number
    state: State
}

interface RevLogUnchecked extends Omit<ReviewLog, "due" | "review"> {
    cid: string
    due: Date | number
    state: State
    review: Date | number
    rating: Rating
}

interface RepeatRecordLog {
    card: CardUnchecked
    log: RevLogUnchecked
}

function repeatAfterHandler(recordLog: RecordLog) {
    const record: { [key in Grade]: RepeatRecordLog } = {} as {
        [key in Grade]: RepeatRecordLog
    }
    for (const grade of Grades) {
        record[grade] = {
            card: {
                ...(recordLog[grade].card as Card & { cid: string }),
                due: recordLog[grade].card.due.getTime(),
                state: recordLog[grade].card.state,
                last_review: recordLog[grade].card.last_review,
            },
            log: {
                ...recordLog[grade].log,
                cid: (recordLog[grade].card as Card & { cid: string }).cid,
                due: recordLog[grade].log.due.getTime(),
                review: recordLog[grade].log.review.getTime(),
                state: recordLog[grade].log.state,
                rating: recordLog[grade].log.rating,
            },
        }
    }
    return record
}

const log = f.repeat(card, new Date(), repeatAfterHandler)
