const { db } = await import("./exports.js")
const { getDocs, query, collection } = await import(
  "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js"
)
let q = query(collection(db, "Common Classrooms"))
let ccRef = await getDocs(q)
let data = ccRef.docs.map((x) => x.data())
data
  .sort((a, b) => new Date(a.submitDate) - new Date(b.submitDate))
  .sort((a, b) => new Date(a.dateRaw) - new Date(b.dateRaw))

const divs = data.map((d) => {
  const parent = document.createElement("div")
  parent.style =
    "display: flex; flex-direction: column; gap: 0.5rem; border-radius: 1rem; background-color: #f0f0f0c0;padding:0.5rem"

  const date = document.createElement("p")
  date.style = "margin:0;display:flex"
  const a = document.createElement("span")
  const b = document.createElement("span")
  b.style = "display:inline-block;margin-left:auto"
  a.textContent = new Date(d.submitDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  })
  b.textContent = new Date(d.dateRaw).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
  date.append(a, b)
  parent.append(date)

  const title = document.createElement("p")
  title.style = "font-weight:bold;margin:0"
  title.textContent = d.title
  title.append(document.createElement("br"))
  const author = document.createElement("em")
  author.textContent = "submitter: " + d.submitter
  title.append(author)
  title.append(document.createElement("br"))
  const hosts = document.createElement("em")
  hosts.textContent = "hosts: " + d.hosts
  title.append(hosts)
  parent.append(title)

  const description = document.createElement("p")
  description.textContent = d.description
  if (d.notes) {
    const br = document.createElement("br")
    const em = document.createElement("em")
    em.textContent = d.notes
    description.append(br, em)
  }
  parent.append(description)
  description.style = "margin:0"

  return parent
})

for (const el of document.body.querySelectorAll("*")) el.remove()

for (const div of divs) document.body.append(div)

document.body.style = "display:grid;grid-template-columns:1fr 1fr;gap:0.5rem"
