import { Transform } from "stream"
import * as path from "path"
import { TsDoxFile, TsDoxClass, TsDoxInterface, TsDoxFunction, TsDoxMethod, TsDoxEntity, TsDoxEnum } from "../runtime"
import { MdWriter } from "./writer";
import { select } from "../runtime/utils";
import * as  Vinyl from 'vinyl';

function transform(this: Transform, file, encoding, cb) {
    const json = JSON.parse(file.contents.toString())
    walkMarkdown(Array.isArray(json) ? json : [json], (content, name) => {
      // const result = Object.create(file.constructor.prototype)
      // result.history = []
      // result.path = file.base + "/" + name
      // result.base = file.base
      // result.contents = Buffer.from(content)
      this.push(new Vinyl({
        cwd: file.cwd,
        path: file.base + "/" + name,
        base: file.base,
        contents: Buffer.from(content),
      }))
    })
    cb(null, null)
  }

export function transformMarkdown() {
  return new Transform({
    objectMode: true,
    transform: transform
  })
}

function walkMarkdown(files: TsDoxFile[], cb: (content: string, file: string) => void) {
  // normalize path names
  files.forEach((it) => it.name = it.name.replace(/[/\\]/g, "/"))

  files
    // all directory paths
    .map((it) => path.dirname(it.name))
    // all variations
    .reduce((set, name) => {
      name.split("/").reduce((combo, token) => {
        combo.push(token)
        set.add(combo.join("/"))
        return combo
      }, [])
      return set
    }, new Set<string>())
    .forEach((dirname) => {
      const entries = files
        .filter((it) => it.name.indexOf(dirname) === 0)
        .map((file) => file.name.replace(dirname, "").split("/").filter(it => !!it).shift())
        .reduce((set, it) => set.add(it), new Set<string>())

      const trace = dirname.split("/")
      const pkg = trace.join("-")

      cb(describeDir(entries, trace), `${pkg}.md`)
    })

  files.forEach((file) => {

    const trace = file.name.split("/")
    const pkg = trace.join("-")

    cb(describeFile(file, trace), `${pkg}.md`)

    select(file, "class").forEach((it) => {
      cb(describeClass(it, [...trace, it.name]), `${pkg}-${it.name}.md`)
    })
    select(file, "interface").forEach((it) => {
      cb(describeClass(it, [...trace, it.name]), `${pkg}-${it.name}.md`)
    })
    select(file, "function").forEach((it) => {
      cb(describeFunction(it, [...trace, it.name]), `${pkg}-${it.name}.md`)
    })
    select(file, "enum").forEach((it) => {
      cb(describeEnum(it, [...trace, it.name]), `${pkg}-${it.name}.md`)
    })
  })
}

function writeBreadcrumb(w: MdWriter, trace: string[]) {
  const breadcrumb = []
  for (let i = 0; i < trace.length; i++) {
    if (i > 0) {
      w.writeString(" &rsaquo; ")
    }
    w.writeLink(trace.slice(0, i + 1).join("-") + ".md", trace[i])
  }
  w.writeLn()
}

function describeDir(entries: Set<string>, trace: string[]) {
  const w = new MdWriter()
  const pkg = trace.join("-")
  writeBreadcrumb(w, trace)

  w.writeLnHeader("Entries", 2)
  entries.forEach((entry) => {
    w.beginListItem().writeLink(`${pkg}-${entry}.md`, entry).writeLn()
  })

  return w.toString()
}

function describeFile(file: TsDoxFile, trace: string[]) {
  const w = new MdWriter()
  const pkg = trace.join("-")

  writeBreadcrumb(w, trace)

  if (Object.keys(file.modules).length) {
    w.writeLnHeader("Modules", 2)
    w.writeTableHeader("Module", "Description")
    for (const key in file.modules) {
      const c = file.modules[key]
      w.beginTableCell().writeLink(`${pkg}-${key}.md`, c.name)
      w.beginTableCell().writeString(c.summary)
      w.endTableRow()
    }
  }

  if (Object.keys(file.classes).length) {
    w.writeLnHeader("Classes", 2)
    w.writeTableHeader("Class", "Description")
    for (const key in file.classes) {
      const c = file.classes[key]
      w.beginTableCell().writeLink(`${pkg}-${key}.md`, c.name)
      w.beginTableCell().writeString(c.summary)
      w.endTableRow()
    }
  }

  if (Object.keys(file.interfaces).length) {
    w.writeLnHeader("Interfaces", 2)
    w.writeTableHeader("Interface", "Description")
    for (const key in file.interfaces) {
      const c = file.interfaces[key]
      w.beginTableCell().writeLink(`${pkg}-${key}.md`, c.name)
      w.beginTableCell().writeString(c.summary)
      w.endTableRow()
    }
  }

  if (Object.keys(file.functions).length) {
    w.writeLnHeader("Functions", 2)
    w.writeTableHeader("Name", "Return Type", "Description")
    for (const key in file.functions) {
      const c = file.functions[key]
      w.beginTableCell().writeLink(`${pkg}-${key}.md`, c.name)
      w.beginTableCell().writeString(c.returnType)
      w.beginTableCell().writeString(c.summary)
      w.endTableRow()
    }
  }

  if (Object.keys(file.enums).length) {
    w.writeLnHeader("Enumerations", 2)
    w.writeTableHeader("Enumeration", "Description")
    for (const key in file.enums) {
      const c = file.enums[key]
      w.beginTableCell().writeLink(`${pkg}-${key}.md`, c.name)
      w.beginTableCell().writeString(c.summary)
      w.endTableRow()
    }
  }

  return w.toString()
}

function describeClass(subject: TsDoxClass|TsDoxInterface, trace: string[]) {
  const w = new MdWriter()
  const pkg = trace.join("-")

  writeBreadcrumb(w, trace)

  writeEntity(w, subject)
  if (subject.extends.length) {
    w.writeLnListItem(`**extends:** ${subject.extends.join(", ")}`)
  }
  if (subject.implements.length) {
    w.writeLnListItem(`**implements:** ${subject.implements.join(", ")}`)
  }

  if (Object.keys(subject.properties).length) {
    w.writeLnHeader("Properties", 2)
    w.writeTableHeader("Name", "Return Type", "Description")
    for (const key in subject.properties) {
      const it = subject.properties[key]
      w.beginTableCell().writeString(it.name)
      w.beginTableCell().writeString(it.returnType)
      w.beginTableCell().writeString(it.summary)
      w.endTableRow()
    }
  }

  if (Object.keys(subject.methods).length) {
    w.writeLnHeader("Methods", 2)
    w.writeTableHeader("Name", "Return Type", "Description")
    for (const key in subject.methods) {
      const it = subject.methods[key]
      w.beginTableCell().writeString(it.name)
      w.beginTableCell().writeString(it.returnType)
      w.beginTableCell().writeString(it.summary)
      w.endTableRow()
    }
  }

  return w.toString()
}

function describeFunction(subject: TsDoxFunction|TsDoxMethod, trace: string[]) {
  const w = new MdWriter()
  const pkg = trace.join("-")

  writeBreadcrumb(w, trace)
  writeEntity(w, subject)

  w.writeCodeBlock(subject.signature, "ts")

  return w.toString()
}

function describeEnum(subject: TsDoxEnum, trace: string[]) {
  const w = new MdWriter()
  const pkg = trace.join("-")

  writeBreadcrumb(w, trace)
  writeEntity(w, subject)

  if (Object.keys(subject.members).length) {
    w.writeLnHeader("Members", 2)
    w.writeTableHeader("Name", "Value", "Description")
    subject.members.forEach((it) => {
      w.beginTableCell().writeString(it.name)
      w.beginTableCell().writeString(it.value)
      w.beginTableCell().writeString(it.summary)
      w.endTableRow()
    })
  }

  return w.toString()
}

function writeEntity(w: MdWriter, e: TsDoxEntity) {
  w.writeLnHeader(`${e.kind} ${e.name}`)
  if (e.summary) {
    w.writeString(e.summary, false)
    w.writeLn()
    w.writeLn()
  }

  if (e.docs.remarks) {
    w.writeString(e.docs.remarks, false)
    w.writeLn()
    w.writeLn()
  }
}
