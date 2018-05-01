
function escapeEntities(v: string) {
  return v.replace(/[#|*_`\[\]\(\)!<>]/gi, (v) => `\\${v}`)
}

export class MdWriter {
  private content: string[] = []

  private get lastToken() {
    return this.content[this.content.length - 1]
  }

  public toString() {
    return this.content.join("")
  }

  public writeString(v: string, escape=true) {
    if (v) {
      this.content.push(escape ? escapeEntities(v) : v)
    }
    return this
  }

  public writeLnHeader(v: string, lvl: number = 1) {
    this.ensureNewLine()
    this.content.push("#".repeat(lvl), " ", v, "\n")
    return this
  }

  public writeLn(v: string = "") {
    this.content.push(v, "\n")
    return this
  }

  public writeLnListItem(v: string, lvl: number = 1) {
    this.content.push("  ".repeat(lvl - 1), "*", " ", v, "\n")
    return this
  }

  public beginListItem(lvl: number = 1) {
    this.content.push("  ".repeat(lvl - 1), "*", " ")
    return this
  }

  public writeLnListItemOrdered(v: string, lvl: number = 1) {
    this.content.push("  ".repeat(lvl - 1), "1.", " ", v, "\n")
    return this
  }

  public beginListItemOrdered(lvl: number = 1) {
    this.content.push("  ".repeat(lvl - 1), "1.", " ")
    return this
  }

  public writeItalic(v: string) {
    this.content.push(" ", "*", v, "*", " ")
    return this
  }

  public writeBold(v: string) {
    this.content.push(" ", "**", v, "**", " ")
    return this
  }

  public writeLink(url: string, name: string) {
    this.content.push("[", name, "]", "(", url, ")")
    return this
  }

  public writeImg(url: string, name: string) {
    this.content.push("![", name, "]", "(", url, ")")
    return this
  }

  public writeCode(v: string) {
    this.content.push("`", v, "`")
    return this
  }

  public writeCodeBlock(v: string, lang: string = "") {
    this.beginCodeBlock(lang)
    this.writeString(v, false)
    this.endCodeBlock()
    return this
  }

  public beginCodeBlock(lang: string = "") {
    this.ensureNewLine()
    this.content.push("```", lang, "\n")
    return this
  }

  public endCodeBlock() {
    this.ensureNewLine()
    this.content.push("```")
    return this
  }

  public writeHr() {
    this.ensureNewLine()
    this.content.push("---", "\n")
    return this
  }

  public writeTableHeader(...v: string[]) {
    this.ensureNewLine()
    this.writeTableRow(...v)
    for (const it of v) {
      this.beginTableCell()
      this.content.push("---")
    }
    this.endTableRow()
    return this
  }

  public writeTableRow(...v: string[]) {
    this.ensureNewLine()
    for (const it of v) {
      this.beginTableCell()
      this.content.push(it)
    }
    this.endTableRow()
    return this
  }

  public beginTableCell() {
    this.content.push("|")
    return this
  }

  public endTableRow() {
    this.content.push("|", "\n")
    return this
  }

  private ensureNewLine() {
    if (this.lastToken !== "\n") {
      this.content.push("\n")
    }
    return this
  }
}
