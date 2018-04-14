export interface TsDoxDict<T> {
  [id: string]: T
 }

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
export interface TsDoxAccessModifiers {
  isPrivate?: boolean
  isPublic?: boolean
  isProtected?: boolean
  isAbstract?: boolean
  isReadonly?: boolean
  isStatic?: boolean
  isExported?: boolean
}
export interface TsDoxEntity extends TsDoxAccessModifiers {
  kind: string
  name: string
  summary: string
  docs: TsDoxDict<any>
}
export interface TsDoxModule extends TsDoxEntity {
  kind: "module"
  location: TsDoxLocation
  decorators: TsDoxDecorator[]
}
export interface TsDoxClass extends TsDoxEntity {
  kind: "class"
  location: TsDoxLocation
  decorators: TsDoxDecorator[]
  properties: TsDoxDict<TsDoxProperty>
  methods: TsDoxDict<TsDoxMethod>
}
export interface TsDoxInterface extends TsDoxEntity {
  kind: "interface"
  location: TsDoxLocation
  properties?: TsDoxDict<TsDoxProperty>
}
export interface TsDoxFunction extends TsDoxEntity{
  kind: "function"
  location: TsDoxLocation
  returnType: string
  parameters: TsDoxParameter[]
  decorators: TsDoxDecorator[]
}
export interface TsDoxMethod extends TsDoxEntity {
  kind: "method"
  location: TsDoxLocation
  returnType: string
  parameters: TsDoxParameter[]
  decorators: TsDoxDecorator[]
}
export interface TsDoxConstructor extends TsDoxEntity {
  kind: "constructor"
  location: TsDoxLocation
  returnType: string
  parameters: TsDoxParameter[]
  decorators: TsDoxDecorator[]
}
export interface TsDoxProperty extends TsDoxEntity {
  kind: "property"
  returnType: string
  isOptional?: boolean
  isGetter?: boolean
  isSetter?: boolean
  decorators: TsDoxDecorator[]
}
export interface TsDoxParameter {
  kind: "parameter"
  name: string
  type: string
  summary: string
  isOptional?: boolean
  isSpread?: boolean
}
export interface TsDoxDecorator {
  kind: "decorator"
  name: string
  args: any[]
}
export interface TsDoxEnum extends TsDoxEntity {
  kind: "enum"
  location: TsDoxLocation
  members: TsDoxEnumMember[]
}
export interface TsDoxEnumMember {
  name: string
  value: string
  summary: string
  docs: TsDoxDict<any>
}
