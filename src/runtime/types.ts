export const Foo = "Bar"

export interface TsDoxDict<T> {
  [id: string]: T
}

/**
 * Defines known symbol types
 */
export type Kind = "file" | "type" | "interface" | "enum" | "class" | "module" | "function" | "method" | "constructor" | "property" | "variable"

/**
 * Describes a typescript file
 */
export interface TsDoxFile {
  /**
   * Path to file
   */
  name: string,
  /**
   * Collection of exported modules
   */
  modules: TsDoxDict<TsDoxModule>
  /**
   * Collection of exported classes
   */
  classes: TsDoxDict<TsDoxClass>
  /**
   * Collection of exported interfaces
   */
  interfaces: TsDoxDict<TsDoxInterface>
  /**
   * Collection of exported functions
   */
  functions: TsDoxDict<TsDoxFunction>
  /**
   * Collectioin of exported enumerations
   */
  enums: TsDoxDict<TsDoxEnum>
  /**
   * Collection of exported variables and constants
   */
  variables: TsDoxDict<TsDoxVariable>
  /**
   * Collection of exported types
   */
  types: TsDoxDict<TsDoxType>
}

/**
 * Describes a source code reference
 */
export interface TsDoxLocation {
  /**
   * Path to source file
   */
  file: string
  /**
   * Line number in file
   */
  line: number
  /**
   * Character index in line
   */
  character: number
}

/**
 * Describes a set of modifiers
 */
export interface TsDoxAccessModifiers {
  /**
   * Whether the symbol is declared as private
   */
  isPrivate?: boolean
  /**
   * Whether the symbol is declared as public
   */
  isPublic?: boolean
  /**
   * Whether the symbol is declared as protected
   */
  isProtected?: boolean
  /**
   * Whether the symbol is declared as abstract
   */
  isAbstract?: boolean
  /**
   * Whether the symbol is declared as readonly
   */
  isReadonly?: boolean
  /**
   * Whether the symbol is declared as static
   */
  isStatic?: boolean
  /**
   * Whether the symbol is declared as exported
   */
  isExported?: boolean
}

/**
 * Describes common properties
 */
export interface TsDoxEntity<T = string> extends TsDoxAccessModifiers {
  /**
   * The type of the sumbol
   */
  kind: T
  /**
   * The name of the symbol
   */
  name: string
  /**
   * A brief summary
   */
  summary: string
  /**
   * JSDoc annotations for the symbol
   */
  docs: TsDoxDict<any>
}

/**
 * Describes common function properties
 */
export interface TsDoxCallableEntity<T> extends TsDoxEntity<T> {
  /**
   * The extracted signature
   */
  signature: string,
  /**
   * Reference to the source code where it is declared
   */
  location: TsDoxLocation
  /**
   * The return type
   */
  returnType: string
  /**
   * The method parameters
   */
  parameters: TsDoxParameter[]
  /**
   * The decorator annotations
   */
  decorators: TsDoxDecorator[]
}

/**
 * Describes a module
 */
export interface TsDoxModule extends TsDoxEntity<"module"> {
  /**
   * Reference to source code
   */
  location: TsDoxLocation
  /**
   * The decorator annotations
   */
  decorators: TsDoxDecorator[]
}

/**
 * Describes a variable
 */
export interface TsDoxVariable extends TsDoxEntity<"variable"> {
  /**
   * The type of the variable
   */
  type: string
  /**
   * The extracted signature
   */
  signature: string
  /**
   * Whether the variable is declared as `cons`
   */
  isConst?: boolean
  /**
   * Whether the variable is declared as `let`
   */
  isLet?: boolean
}

/**
 * Describes a class
 */
export interface TsDoxClass extends TsDoxEntity<"class"> {
  /**
   * Heritage information
   */
  extends: string[],
  /**
   * Heritage information
   */
  implements: string[],
  /**
   * Reference to source code
   */
  location: TsDoxLocation
  /**
   * Annotated decorators
   */
  decorators: TsDoxDecorator[]
  /**
   * The class properties
   */
  properties: TsDoxDict<TsDoxProperty>
  /**
   * The class methods
   */
  methods: TsDoxDict<TsDoxMethod>
}

/**
 * Describes an interface
 */
export interface TsDoxInterface extends TsDoxEntity<"interface"> {
  /**
   * Heritage information
   */
  extends: string[],
  /**
   * Heritage information
   */
  implements: string[],
  /**
   * Reference to source code
   */
  location: TsDoxLocation
  /**
   * The declared properties
   */
  properties?: TsDoxDict<TsDoxProperty>
  /**
   * The declared methods
   */
  methods: TsDoxDict<TsDoxMethod>
}

/**
 * Describes a function
 */
export interface TsDoxFunction extends TsDoxCallableEntity<"function"> {

}

/**
 * Describes a class method
 */
export interface TsDoxMethod extends TsDoxCallableEntity<"method"> {

}

/**
 * Describes a class constructor
 */
export interface TsDoxConstructor extends TsDoxCallableEntity<"constructor"> {

}

/**
 * Describes a class property
 */
export interface TsDoxProperty extends TsDoxEntity<"property"> {
  /**
   * The return type
   */
  returnType: string
  /**
   * Whether it is declared a soptional
   */
  isOptional?: boolean
  /**
   * Whether it is/has a getter
   */
  isGetter?: boolean
  /**
   * Wheter it is/has a setter
   */
  isSetter?: boolean
  /**
   * The annotated decorators
   */
  decorators: TsDoxDecorator[]
}

/**
 * Describes a method parameter
 */
export interface TsDoxParameter {
  /**
   * Is always `parameter`
   */
  kind: "parameter"
  /**
   * The name of the symbol
   */
  name: string
  /**
   * The parameter type
   */
  type: string
  /**
   * A brief summary
   */
  summary: string
  /**
   * Whether it is declared as optional
   */
  isOptional?: boolean
  /**
   * Whether it is declared with spread operator
   */
  isSpread?: boolean
}

/**
 * Describes a decorator annotation
 */
export interface TsDoxDecorator {
  /**
   * Is always `decorator`
   */
  kind: "decorator"
  /**
   * The name of the decorator
   */
  name: string
  /**
   * The given arguments to the decorator
   */
  args: any[]
}

/**
 * Describes a type
 */
export interface TsDoxType extends TsDoxEntity<"type"> {
  /**
   * Reference to the source code where it is declared
   */
  location: TsDoxLocation
  /**
   * The extracted signature
   */
  signature: string
}

/**
 * Describes an enumeration
 */
export interface TsDoxEnum extends TsDoxEntity<"enum"> {
  /**
   * Reference to the source code where it is declared
   */
  location: TsDoxLocation
  /**
   * The enumeration members
   */
  members: TsDoxEnumMember[]
}

/**
 * Describes an enumeration member
 */
export interface TsDoxEnumMember {
  /**
   * The name of the enum
   */
  name: string
  /**
   * The value of the enum
   */
  value: string
  /**
   * A brief summary
   */
  summary: string
  /**
   * A documentation object
   */
  docs: TsDoxDict<any>
}
