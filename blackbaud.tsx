// A Blackbaud scraper that gets data in a format kama sona can understand.

import { h, render, signal } from "./yet-another-js-framework"

function select<T extends HTMLElement>(
  parent: ParentNode,
  selector: string
): T[] {
  return Array.from(parent.querySelectorAll(selector))
}

const [getStatus, setStatus] = signal("Loading...")

{
  const el = (
    <div
      style="
        position: fixed;
        bottom: 1.5rem;
        left: 1.5rem;
        border-radius: 0.25rem;
        background: white;
        box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.2);
        color: black;
        padding: 0.5rem 0.75rem;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
        font-size: 1rem;
      "
    >
      {getStatus}
    </div>
  )

  render(el, document.body)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

namespace AssignmentCenter {
  export interface AssignmentOverview {
    document: Document
    assign: string
    class: string
    due: string
    href: string
    link: HTMLAnchorElement
    status: string
    title: string
    type: string
  }

  export function get(document = window.document): AssignmentOverview[] {
    const rows = select<HTMLTableRowElement>(
      document,
      "#assignment-center-assignment-items tr"
    )

    return rows.map((el) => {
      const [className, type, _, assign, due, status] = [...el.children].map(
        (x) => x.textContent!
      )

      const detailsEl = el.children[2]! as HTMLTableCellElement
      const detailsLink = detailsEl.children[0] as HTMLAnchorElement

      return {
        document,
        class: className!,
        type: type!,
        title: detailsLink.textContent!,
        href: detailsLink.href,
        link: detailsLink,
        assign: assign!,
        due: due!,
        status: status!,
      }
    })
  }

  export async function travel(
    overview: AssignmentOverview
  ): Promise<AssignmentOverview & Assignment.AssignmentDetails> {
    setStatus("Getting assignment details: " + overview.title)
    overview.link.click()
    await wait(2000)
    const details = Assignment.get(overview.document)
    return { ...overview, ...details }
  }

  export function travelInEmbed(overview: AssignmentOverview) {
    return new Promise<AssignmentOverview & Assignment.AssignmentDetails>(
      (resolve, reject) => {
        const frame = document.createElement("iframe")
        document.body.appendChild(frame)
        frame.src = overview.href
        frame.style.width = "500px"
        frame.style.height = "400px"

        frame.onload = async () => {
          await wait(10000)

          if (!frame.contentWindow) {
            reject("No content window")
            return
          }

          const details = Assignment.get(frame.contentWindow.document)
          resolve({ ...overview, ...details })
          frame.remove()
        }
      }
    )
  }

  export async function start(document = window.document) {
    const overviews = get(document)
    const total = overviews.length
    let count = 0

    setStatus("Getting assignment details: 0 of " + total)

    const output = await Promise.all(
      overviews.map(async (overview) => {
        const output = await travelInEmbed(overview)
        setStatus("Getting assignment details: " + ++count + " of " + total)
        return output
      })
    )

    setStatus("Done!")

    return output
  }
}

namespace Assignment {
  export interface AssignmentDetails {
    content: string
    links: {
      href: string
      text: string
    }[]
    submittedDate: Date | undefined
    submission: string | undefined
  }

  export function get(document = window.document): AssignmentDetails {
    const section = select(document, ".bb-tile-content-section")[0]!

    const contentEl = section.children[2]!
    const content = contentEl.innerHTML

    let links: { href: string; text: string }[] = []
    const linksEl = select(document, "#assignment-detail-linked-content")[0]
    if (linksEl) {
      links = select<HTMLAnchorElement>(linksEl, "a").map((link) => ({
        href: link.href,
        text: link.textContent!,
      }))
    }

    const submittedDate = select(
      document,
      ".assignment-detail-header-info"
    )[0]?.textContent?.slice(13)

    const submission = select(document, "#assignment-info-textedit")[0]
      ?.children[0]?.innerHTML

    return {
      content,
      links,
      submittedDate: submittedDate ? new Date(submittedDate) : undefined,
      submission,
    }
  }

  export function exit(document = window.document) {
    select(document, "#BackButton")[0]?.click()
  }
}

export {}
