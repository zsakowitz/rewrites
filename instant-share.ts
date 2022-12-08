// A test implementation of the "Share with Students" chrome extension.

function setupInstantShare() {
  const buttons = document.getElementsByClassName("docs-titlebar-buttons")[0]

  if (!buttons || !(buttons instanceof HTMLElement)) {
    setTimeout(setupInstantShare, 1000)
    return
  }

  if (window.hasShareWithStudents) {
    return
  }

  window.hasShareWithStudents = true

  const span = document.createElement("span")
  span.setAttribute("displayname", "null")
  span.className = "scb-container"

  const div = document.createElement("div")
  div.setAttribute("role", "button")
  div.className =
    "goog-inline-block jfk-button jfk-button-action docs-titlebar-button"
  div.ariaDisabled = "false"
  div.ariaLabel =
    "Create a link that, when opened, will copy the document and share it with you."
  div.tabIndex = 0
  div.setAttribute(
    "style",
    `
  user-select: none;
  background-image: none;
  border: 1px solid transparent !important;
  border-radius: 4px;
  box-shadow: none;
  box-sizing: border-box;
  font-family: "Google Sans", Roboto, RobotoDraft, Helvetica, Arial, sans-serif;
  font-weight: 500;
  font-size: 14px;
  height: 36px;
  letter-spacing: 0.25px;
  line-height: 16px;
  padding: 9px 24px 11px 24px;
  background: #1a73e8;
  color: #fff;
  padding: 9px 16px 10px 12px;
  text-transform: capitalize;
  cursor: pointer;`
  )
  div.onmouseover = () => {
    div.style.background = "#2b7de9"
    div.style.boxShadow = "0 1px 3px 1px rgb(66 133 244 / 15%)"
    div.classList.add("jfk-button-hover")
  }
  div.onmouseout = () => {
    div.style.background = "#1a73e8"
    div.style.boxShadow = ""
    div.classList.remove("jfk-button-hover")
  }

  div.onclick = () => {
    const account = document.querySelector("[aria-label^='Google Account: ']")

    let email, name, title
    if (account && account.ariaLabel) {
      name = account.ariaLabel?.match(/:\s+([^)]+)\s+\(/)?.[1].trim()
      email = account.ariaLabel?.match(/\(([^)]+@[^)]+)\)/)?.[1].trim()
    }

    if (email) {
      const message = `Is your email ${email}? Click OK to continue or Cancel to edit it.`
      if (!confirm(message)) email = ""
    }

    if (!email) {
      while (!(email = prompt("Type in your email address.", email || ""))) {
        alert("Please enter an email address.")
      }
    }

    title = document.title.split(" - ").slice(0, -1).join(" - ")

    const shareUrl = new URL(`./copy?userstoinvite=${email}`, location.href)
    showResult(name, title, shareUrl.href)
  }

  const icon = document.createElement("span")
  icon.className =
    "scb-icon apps-share-sprite scb-button-icon scb-unlisted-icon-white"
  icon.innerHTML = "&nbsp;"

  const label = document.createTextNode("Share with Students")

  div.append(icon, label)
  span.append(div)
  buttons.prepend(span)
}

function showResult(name: string | undefined, title: string, shareUrl: string) {
  try {
    const dialog = document.createElement("dialog")
    dialog.oncancel = () => dialog.remove()
    dialog.style.fontSize = "1.2rem"
    dialog.style.borderRadius = "1em"
    dialog.style.border = "0"
    dialog.style.padding = "1em 2em"

    const intro = document.createElement("p")
    if (name) {
      intro.textContent = `${name}, copy this into your assignment editor:`
    } else {
      intro.textContent = "Copy this into your assignment editor:"
    }

    const hint = document.createElement("p")
    const key = navigator.userAgent.includes("Mac") ? "Command" : "Control"
    hint.textContent = `(Click the paragraph to select it, then press ${key}-C to copy.)`

    const body = document.createElement("p")
    body.style.userSelect = "all"
    body.style.margin = "2em"

    const t1 = document.createTextNode("Click this link to ")

    const link = document.createElement("a")
    link.href = shareUrl
    link.target = "_blank"
    link.textContent = `copy ${title || "the document"}`

    const t2 = document.createTextNode(" and share it with your teacher.")
    if (name) t2.data = ` and share it with ${name}.`

    const closeMessage = document.createElement("p")
    closeMessage.textContent =
      "Press Escape (Esc) on your keyboard to close this popup."

    body.append(t1, link, t2)
    dialog.append(intro, hint, body, closeMessage)
    document.body.append(dialog)

    dialog.showModal()
  } catch {
    alert("A fatal error has occurred. Please try again.")
  }
}

if (location.pathname.endsWith("/edit")) {
  setupInstantShare()
}

declare global {
  var hasShareWithStudents: boolean | undefined

  interface HTMLDialogElement {
    oncancel: ((event: Event) => void) | null
  }
}

export {}
