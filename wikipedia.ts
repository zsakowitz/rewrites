// An engine that can look through Wikipedia links.

export function getContentBody(element: Element): Element | undefined {
  // .mw-parser-output directly has all body elements.
  let bodies = [...element.getElementsByClassName("mw-parser-output")]

  // Wikipedia's lock icon has mw-parser-output, but this line removes it.
  bodies = bodies.filter((body) => body.childElementCount > 1)

  return bodies[0]
}

export function filterCitations(element: Element | undefined): Element[] {
  if (!element) {
    return []
  }

  const output: Element[] = []

  for (const child of element.children) {
    // Stop parsing at .ref-list.
    if (
      child.classList.contains("ref-list") ||
      (child.tagName == "H2" && child.textContent == "References")
    ) {
      break
    }

    output.push(child)
  }

  return output
}

export function linksIn(elements: Element[]): HTMLAnchorElement[] {
  const output: HTMLAnchorElement[] = []

  for (const element of elements) {
    output.push(
      ...element.querySelectorAll<HTMLAnchorElement>("a[href^='/wiki/']")
    )
  }

  return output
}

export interface Link {
  href: string
  title: string
  level: number
  from?: string
}

export function linksToObjects(
  level = 1,
  elements: HTMLAnchorElement[]
): Link[] {
  return elements.map((link) => ({
    href: link.href,
    title: link.textContent || "",
    level,
  }))
}

/**
 * Call this with extract(1, document) to get the links in the current document,
 * then use `subtreeAll` to search those links.
 */
export function extract(level: number, element: Element): Link[] {
  const body = getContentBody(element)
  const paragraphs = filterCitations(body)
  const links = linksIn(paragraphs)

  return linksToObjects(level, links)
}

export function getUnique(links: Link[]): Link[] {
  const result: Record<string, Link> = {}
  links.forEach((link) => (result[link.href] = link))

  return Object.values(result)
}

export async function subtree(source: Link): Promise<Link[]> {
  const response = await fetch(source.href)
  if (!response.ok) return []

  const text = await response.text()
  const element = document.createElement("div")
  element.innerHTML = text

  return extract(source.level + 1, element).map((link) => {
    link.from = source.href
    return link
  })
}

export async function subtreeAll(links: Link[]): Promise<Link[]> {
  return getUnique((await Promise.all(links.map(subtree))).flat())
}
