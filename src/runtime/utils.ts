import { TsDoxClass, TsDoxFile, TsDoxInterface, TsDoxFunction, TsDoxEnum } from "./types"

export interface FindOptions {
  kind: "interface" | "class" | "function" | "enum"
  pkg?: string | RegExp
  name?: string | RegExp
}

function kindToKey(kind: "interface" | "class" | "function" | "enum"): keyof TsDoxFile {
  switch (kind) {
    case "interface": return "interfaces"
    case "class": return "classes"
    case "function": return "functions"
    case "enum": return "enums"
  }
  return null
}

export function filter(input: TsDoxFile | TsDoxFile[], options: FindOptions) {
  const list = Array.isArray(input) ? input : [input]
  const pkgFilter = typeof options.pkg === "string" ? new RegExp(options.pkg) : options.pkg
  const key = kindToKey(options.kind)
  const nameFilter = typeof options.name === "string" ? new RegExp(options.name) : options.name

  return list
    .filter((file) => {
      return key in file && (!pkgFilter || pkgFilter.test(file.name))
    })
    .reduce((arr, file) => {
      const items = file[key]
      arr.push(...Object.keys(items).map((name) => items[name]))
      return arr
    }, [])
    .filter((it) => {
      return it && it.name
    })
    .filter((it) => {
      return !nameFilter || nameFilter.test(it.name)
    })
}

export function findClass(input: TsDoxFile | TsDoxFile[], pkg?: string | RegExp, name?: string | RegExp): TsDoxClass[] {
  return filter(input, {
    kind: "class",
    pkg: pkg,
    name: name,
  })
}

export function findInterface(input: TsDoxFile | TsDoxFile[], pkg?: string | RegExp, name?: string | RegExp): TsDoxInterface[] {
  return filter(input, {
    kind: "interface",
    pkg: pkg,
    name: name,
  })
}

export function findFunction(input: TsDoxFile | TsDoxFile[], pkg?: string | RegExp, name?: string | RegExp): TsDoxFunction[] {
  return filter(input, {
    kind: "function",
    pkg: pkg,
    name: name,
  })
}

export function findEnum(input: TsDoxFile | TsDoxFile[], pkg?: string | RegExp, name?: string | RegExp): TsDoxEnum[] {
  return filter(input, {
    kind: "enum",
    pkg: pkg,
    name: name,
  })
}
