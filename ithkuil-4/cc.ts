const { getDocs, query, collection } = await import(
  // @ts-ignore
  "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js"
)

import { db } from "./exports.js"

export type DateString = string & { __date?: string }
export type GoogleAccountID = string & { __googleAccountId?: string }

class CC {
  readonly d: string
  readonly title: string
  readonly description: string
  readonly notes: string
  readonly room: string
  readonly dateLabel: string

  readonly coasterId: readonly string[]
  readonly dateRaw: Date
  readonly hosts: string
  readonly maximumAttendees: number
  readonly overflow: "yes" | "some" | "no" | "."
  readonly publishDate: Date
  readonly published: boolean
  readonly submitter: GoogleAccountID

  constructor(
    coasterId: readonly string[],
    dateLabel: string,
    dateRaw: Date,
    description: string,
    hosts: string,
    maximumAttendees: number,
    notes: string,
    overflow: "yes" | "some" | "no" | ".",
    publishDate: Date,
    published: boolean,
    room: string,
    submitter: GoogleAccountID,
    title: string,
  ) {
    // if (
    //   !Array.isArray(coasterId) ||
    //   coasterId.some((x) => typeof x != "string")
    // ) {
    //   throw new Error("Invalid Coaster ID: " + coasterId + ".")
    // }

    // if (typeof dateLabel != "string") {
    //   throw new Error("Invalid date label: " + dateLabel + ".")
    // }

    // if (!(dateRaw instanceof Date) || isNaN(dateRaw.getTime())) {
    //   throw new Error("Invalid raw date: " + dateRaw + ".")
    // }

    // if (typeof description != "string") {
    //   throw new Error("Invalid description: " + description + ".")
    // }

    // if (typeof hosts != "string") {
    //   throw new Error("Invalid hosts: " + hosts + ".")
    // }

    // if (typeof maximumAttendees != "number" || isNaN(maximumAttendees)) {
    //   throw new Error("Invalid maximum attendees: " + maximumAttendees + ".")
    // }

    // if (typeof notes != "string") {
    //   throw new Error("Invalid notes: " + notes + ".")
    // }

    // if (
    //   overflow !== "yes" &&
    //   overflow !== "some" &&
    //   overflow !== "no" &&
    //   overflow !== "."
    // ) {
    //   throw new Error("Invalid overflow: " + overflow + ".")
    // }

    // if (!(publishDate instanceof Date) || isNaN(publishDate.getTime())) {
    //   throw new Error("Invalid publish date: " + publishDate + ".")
    // }

    // if (typeof published != "boolean") {
    //   throw new Error("Invalid published: " + published + ".")
    // }

    // if (typeof room != "string") {
    //   throw new Error("Invalid room: " + room + ".")
    // }

    // if (typeof submitter != "string") {
    //   throw new Error("Invalid submitter: " + submitter + ".")
    // }

    // if (typeof title != "string") {
    //   throw new Error("Invalid title: " + title + ".")
    // }

    this.coasterId = coasterId
    this.d =
      (dateRaw.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      dateRaw.getDate().toString().padStart(2, "0")
    this.dateLabel = dateLabel
    this.dateRaw = dateRaw
    this.description = description
    this.hosts = hosts
    this.maximumAttendees = maximumAttendees
    this.notes = notes
    this.overflow = overflow
    this.publishDate = publishDate
    this.published = published
    this.room = room
    this.submitter = submitter
    this.title = title
  }
}

async function getCCs() {
  const q = query(collection(db, "Common Classrooms"))

  const querySnapshot: any[] = (await getDocs(q)).docs

  const data = querySnapshot
    .map((doc) => doc.data())
    .map(
      (doc) =>
        new CC(
          doc.coasterId,
          doc.dateLabel,
          new Date(
            +doc.dateRaw.split("-")[0],
            +doc.dateRaw.split("-")[1] - 1,
            +doc.dateRaw.split("-")[2],
          ),
          doc.description,
          doc.hosts,
          +doc.maximumAttendees,
          doc.notes,
          doc.overflow,
          new Date(
            +doc.publishDate.split("-")[0],
            +doc.publishDate.split("-")[1] - 1,
            +doc.publishDate.split("-")[2],
          ),
          doc.published,
          doc.room,
          doc.submitter,
          doc.title,
        ),
    )
    .sort((a, b) => a.dateRaw.getTime() - b.dateRaw.getTime())

  return data
}

class User {
  constructor(
    readonly campusID: string,
    readonly commonClassroom: string | null | undefined,
    readonly firstName: string,
    readonly graduationYear: string,
    readonly lastName: string,
    readonly profilePicLink: string,
  ) {
    // if (typeof campusID != "string") {
    //   throw new Error("Invalid campusID: " + campusID + ".")
    // }
    // if (typeof commonClassroom != "string" && commonClassroom != null) {
    //   throw new Error("Invalid commonClassroom: " + commonClassroom + ".")
    // }
    // if (typeof firstName != "string") {
    //   throw new Error("Invalid firstName: " + firstName + ".")
    // }
    // if (typeof graduationYear != "string") {
    //   throw new Error("Invalid graduationYear: " + graduationYear + ".")
    // }
    // if (typeof lastName != "string") {
    //   throw new Error("Invalid lastName: " + lastName + ".")
    // }
    // if (typeof profilePicLink != "string") {
    //   throw new Error("Invalid profilePicLink: " + profilePicLink + ".")
    // }
  }
}

async function getUsers() {
  const q = query(collection(db, "Users"))

  const querySnapshot: any[] = (await getDocs(q)).docs

  const data = querySnapshot
    .map((doc) => doc.data())
    .map(
      (doc) =>
        new User(
          doc.campusID,
          doc.commonClassroom,
          doc.firstName,
          doc.graduationYear,
          doc.lastName,
          doc.profilePicLink,
        ),
    )
    .sort((a, b) =>
      a.firstName < b.firstName ? -1 : a.firstName > b.firstName ? 1 : 0,
    )
    .sort((a, b) =>
      a.lastName < b.lastName ? -1 : a.lastName > b.lastName ? 1 : 0,
    )
    .sort((a, b) =>
      a.graduationYear < b.graduationYear
        ? -1
        : a.graduationYear > b.graduationYear
        ? 1
        : 0,
    )

  return data
}
