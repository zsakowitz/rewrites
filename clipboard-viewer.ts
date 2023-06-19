interface ClipboardItem {
  readonly item: number
  readonly presentationStyle: PresentationStyle
  readonly type: string
  readonly content: string
}

const readEl = document.createElement("button")
readEl.textContent = "Read"
readEl.onclick = readClipboard

const table = document.createElement("table")

const thead = document.createElement("thead")

{
  const tr = document.createElement("tr")

  const th1 = document.createElement("th")
  th1.textContent = "Item #"

  const th2 = document.createElement("th")
  th2.textContent = "Type"

  const th3 = document.createElement("th")
  th3.textContent = "Presentation Style"

  const th4 = document.createElement("th")
  th4.textContent = "Content"

  tr.append(th1, th2, th3, th4)

  thead.appendChild(tr)
}

document.body.append(readEl, table)

const tbody = document.createElement("tbody")
table.append(thead, tbody)

function createRow({ content, item, presentationStyle, type }: ClipboardItem) {
  const tr = document.createElement("tr")

  const itemEl = document.createElement("td")
  itemEl.textContent = "" + item

  const typeEl = document.createElement("td")
  typeEl.textContent = "" + type

  const presentationStyleEl = document.createElement("td")
  presentationStyleEl.textContent = "" + presentationStyle

  const contentEl = document.createElement("td")

  const textarea = document.createElement("textarea")

  textarea.value = content
  textarea.readOnly = true

  contentEl.appendChild(textarea)
  tr.append(itemEl, typeEl, presentationStyleEl, contentEl)

  return {
    tr,
    type: typeEl,
    content: contentEl,
    textarea,
  }
}

function refreshTable(data: readonly ClipboardItem[]) {
  tbody.childNodes.forEach((node) => node.remove())

  const rows = data.map((item) => createRow(item).tr)

  console.log(rows)

  tbody.append(...rows)
}

async function readClipboard() {
  const data = await navigator.clipboard.read()

  console.log(data)

  const items = await Promise.all(
    data.flatMap((value, index) =>
      value.types.map(async (type): Promise<ClipboardItem> => {
        const blob = await value.getType(type)

        return {
          item: index,
          type: blob.type,
          presentationStyle: value.presentationStyle,
          content: await blob.text(),
        }
      }),
    ),
  )

  console.log(items)

  refreshTable(items)
}

export {}
