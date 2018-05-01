import { TsDoxClass, TsDoxFile, TsDoxInterface, TsDoxFunction, TsDoxEnum, Kind, TsDoxVariable, TsDoxType, TsDoxModule, TsDoxDict } from "./types"

export interface FindOptions {
  pkg?: string | RegExp
  name?: string | RegExp
}

function kindToKey(kind: Kind): keyof TsDoxFile {
  switch (kind) {
    case "module": return "modules"
    case "interface": return "interfaces"
    case "class": return "classes"
    case "function": return "functions"
    case "enum": return "enums"
    case "variable": return "variables"
    case "type": return "types"
  }
  return null
}

export function select(input: TsDoxFile | TsDoxFile[], kind: "module", options?: FindOptions): TsDoxModule[]
export function select(input: TsDoxFile | TsDoxFile[], kind: "class", options?: FindOptions): TsDoxClass[]
export function select(input: TsDoxFile | TsDoxFile[], kind: "interface", options?: FindOptions): TsDoxInterface[]
export function select(input: TsDoxFile | TsDoxFile[], kind: "function", options?: FindOptions): TsDoxFunction[]
export function select(input: TsDoxFile | TsDoxFile[], kind: "enum", options?: FindOptions): TsDoxEnum[]
export function select(input: TsDoxFile | TsDoxFile[], kind: "type", options?: FindOptions): TsDoxType[]
export function select(input: TsDoxFile | TsDoxFile[], kind: "variable", options?: FindOptions): TsDoxVariable[]
export function select(input: TsDoxFile | TsDoxFile[], kind: Kind, options: FindOptions = {}) {
  const list = Array.isArray(input) ? input : [input]
  const pkgFilter = typeof options.pkg === "string" ? new RegExp(options.pkg) : options.pkg
  const key = kindToKey(kind)
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
