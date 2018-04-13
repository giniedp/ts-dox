export type TsDoxDict<T> = { [id: string]: T }

export interface TsDoxFile {
  classes: Map<string, TsDoxClass>
  interfaces: Map<string, TsDoxInterface>
  functions: Map<string, TsDoxFunction>
}
export interface TsDoxLocation {
  line: number
  character: number
  file: string
}
export interface TsDoxClass {
  kind: string
  name: string
  location: any
  summary: string
  remarks: string
  decorators: TsDoxDecorator[]
  properties: TsDoxDict<TsDoxProperty>
  methods: TsDoxDict<TsDoxMethod>
  modifiers: TsDoxModifiers
}
export interface TsDoxInterface {
  kind: string
  name: string
  location: any
  summary: string
  remarks: string
  properties?: TsDoxDict<TsDoxProperty>
  modifiers: TsDoxModifiers
}
export interface TsDoxDecorator {
  kind: string
  name: string
  args: any[]
}
export interface TsDoxFunction {
  kind: string
  name: string
  summary: string
  remarks: string
  returnType: string
  modifiers: TsDoxModifiers
  parameters: TsDoxParameter[]
  decorators: TsDoxDecorator[]
}
export interface TsDoxMethod {
  kind: string
  name: string
  summary: string
  remarks: string
  returnType: string
  modifiers: TsDoxModifiers
  parameters: TsDoxParameter[]
  decorators: TsDoxDecorator[]
}
export interface TsDoxConstructor {
  kind: string
  name: string
  summary: string
  remarks: string
  returnType: string
  modifiers: TsDoxModifiers
  parameters: TsDoxParameter[]
  decorators: TsDoxDecorator[]
}
export interface TsDoxProperty {
  kind: string
  name: string
  summary: string
  remarks: string
  returnType: string
  isOptional?: boolean
  isGetter?: boolean
  isSetter?: boolean
  modifiers: TsDoxModifiers
  decorators: TsDoxDecorator[]
}
export interface TsDoxParameter {
  kind: string
  name: string
  type: string
  summary: string
  isOptional?: boolean
  isSpread?: boolean
}
export interface TsDoxModifiers {
  isPrivate?: boolean
  isPublic?: boolean
  isProtected?: boolean
  isAbstract?: boolean
  isReadonly?: boolean
  isStatic?: boolean
  isExported?: boolean
}
