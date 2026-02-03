function jsx(strings: TemplateStringsArray, ...args: unknown[]) {
    const value = String.raw({ raw: strings }, ...args)
    const el = document.createElement("div")
    el.innerHTML = value
    return el.children[0]
}

jsx`
  <h1 class=${"fred"}>
  </h1>
`
