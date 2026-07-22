const { getDocs, query, collection, where } = await import(
    "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js" + ""
)
const { db } = await import("./exports.js")

const ccs = (
    await getDocs(query(collection(db, "Common Classrooms")))
).docs.map((x: any) => ({ id: x.id, ...x.data() })) as {
    coasterId: []
    dateLabel: "September 22nd"
    dateRaw: `${number}-${number}-${number}`
    description: string
    hosts: string
    id: string
    maximumAttendees: `${number}`
    notes: string
    overflow: string
    publishDate: `${number}-${number}-${number}-${number}-${number}`
    published: boolean
    room: string
    submitter: string
    title: string
}[]

const users = (await getDocs(query(collection(db, "Users")))).docs.map(
    (x: any) => ({ id: x.id, ...x.data() }),
) as {
    commonClassroom: string
    graduationYear: `${number}`
    id: string
    imageLink: string
    name: string
}[]

document.querySelectorAll(".ccDiv").forEach((div) => {
    const id = div.id.slice(5)
    const people = users.filter((x) => x.commonClassroom == id)

    const namesEl = document.createElement("div")
    namesEl.style.background = "transparent"
    namesEl.style.float = "right"

    for (const person of people) {
        const img = document.createElement("img")
        img.src = person.imageLink
        img.style.borderRadius = "999999px"
        img.style.width = "2rem"
        img.style.height = "2rem"
        img.style.objectFit = "cover"
        img.style.margin = "0"
        img.style.marginRight = "0.25rem"
        img.style.background = "transparent"

        const label = document.createElement("span")
        label.textContent = person.name
        label.style.margin = "0"
        label.style.background = "transparent"
        label.style.color = "var(--z-color, black)"
        label.style.fontFamily = "PoppinsSemiBold"

        const span = document.createElement("span")
        span.appendChild(img)
        span.appendChild(label)
        span.style.background = "transparent"
        span.style.color = "var(--z-color, black)"
        span.style.fontFamily = "PoppinsSemiBold"
        span.style.display = "inline-flex"
        span.style.alignItems = "center"
        span.style.justifyContent = "center"
        span.style.margin = "0"
        span.style.padding = "0 1rem"
        namesEl.appendChild(span)
    }

    div.appendChild(namesEl)
})
