import * as ts from "typescript"
import * as path from "path"

import { TsDoxDecorator, TsDoxEnum, TsDoxAccessModifiers, TsDoxLocation, TsDoxFunction, TsDoxMethod, TsDoxProperty, TsDoxClass, TsDoxInterface, TsDoxParameter, TsDoxConstructor, TsDoxVariable, TsDoxType } from "../runtime"

export function location(node: ts.Node, src: ts.SourceFile): TsDoxLocation {
  const { line, character } = src.getLineAndCharacterOfPosition(node.getStart())
  return {
    line: line,
    character: character,
    file: path.relative(process.cwd(), src.fileName),
  }
}

export function remarks(node: ts.Node): string {
  const doc = (ts.getJSDocTags(node) || []).find((it) => it.tagName.escapedText === "remarks")
  return doc ? doc.comment.trim() : ""
}

export function entityAccess(flags: ts.ModifierFlags): TsDoxAccessModifiers {
  const result: TsDoxAccessModifiers = {}
  if (flags) {
    if (flags & ts.ModifierFlags.Private) result.isPrivate = true
    if (flags & ts.ModifierFlags.Public) result.isPublic = true
    if (flags & ts.ModifierFlags.Protected) result.isProtected = true
    if (flags & ts.ModifierFlags.Abstract) result.isAbstract = true
    if (flags & ts.ModifierFlags.Readonly) result.isReadonly = true
    if (flags & ts.ModifierFlags.Static) result.isStatic = true
    if (flags & ts.ModifierFlags.Export) result.isExported = true
  }
  return result
}

export function summary(node: ts.Node, root: ts.SourceFile): string {
  const text = root.getFullText()
  const comments = ts.getLeadingCommentRanges(text, node.pos) || []
  const comment = comments[comments.length - 1]
  if (!comment) return ""
  const lines = text
    .substring(comment.pos, comment.end)
    .replace(/^\s*(\/\/)|(\/\*+)|(\*+\/)|(\*+)/ig, "")
    .split('\n')
    .map(it => it.trim())
  const limit = lines.findIndex((it) => /^@/.test(it))

  return lines
    .filter((it, index) => limit === -1 || index < limit)
    .join('\n')
    .trim()
}

export function jsdoc(node: ts.Node) {
  const result = {}
  ts.getJSDocTags(node).forEach((tag) => {
    const name = tag.tagName.text
    // if no comment is given, use "true" as value
    const value = tag.comment || true
    if (!(name in result)) {
      result[name] = value
      return
    }
    if (!Array.isArray(result[name])) {
      result[name] = [result[name]]
    }
    result[name].push(value)
  })
  return result
}

export function tokenName(node: ts.PropertyName | ts.Identifier | ts.StringLiteral | ts.NumericLiteral | ts.QualifiedName | ts.BindingName) {
  if (!node) {
    return ""
  }
  if (ts.isIdentifier(node)) {
    return node.escapedText.toString()
  }
  if (ts.isStringLiteral(node)) {
    return `"${node.text}"`
  }
  if (ts.isNumericLiteral(node)) {
    return node.text
  }
  if (ts.isQualifiedName(node)) {
    return `${tokenName(node.left)}.${node.right.escapedText}`
  }
  return (node as ts.Node).getText()
}

export function typeName(node: ts.TypeNode): string {
  if (!node) {
    return ""
  }

  if (ts.isArrayTypeNode(node)) {
    return `Array<${typeName(node.elementType)}>`
  }

  if (ts.isTupleTypeNode(node)) {
    return `[${node.elementTypes.map(it => typeName(it))}]`
  }
  if (ts.isTypeReferenceNode(node)) {
    let name = tokenName(node.typeName)
    if (node.typeArguments) {
      name += `<${node.typeArguments.map(it => typeName(it)).join(", ")}>`
    }
    return name
  }
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword:
      return "string"
    case ts.SyntaxKind.BooleanKeyword:
      return "boolean"
    case ts.SyntaxKind.NumberKeyword:
      return "number"
    case ts.SyntaxKind.AnyKeyword:
      return "any"
    case ts.SyntaxKind.VoidKeyword:
      return "void"
    case ts.SyntaxKind.NullKeyword:
      return "null"
    case ts.SyntaxKind.UndefinedKeyword:
      return "undefined"
    case ts.SyntaxKind.NeverKeyword:
      return "never"
  }
  return ""
}

export function makeDecorator(node: ts.Decorator, root: ts.SourceFile): TsDoxDecorator {
  const expr = node.expression["expression"] || {}
  const args = (node.expression["arguments"] || []).map((arg) => {
    if (ts.isStringLiteral(arg) || ts.isNumericLiteral(arg)) {
      return arg.getText(root)
    }
    if (ts.isObjectLiteralExpression(arg)) {
      const obj = {}
      arg.properties.forEach((it) => {
        if (ts.isPropertyAssignment(it)) {
          obj[tokenName(it.name)] = it.initializer.getText(root)
          return
        }
        if (ts.isSpreadAssignment(it)) {
          obj[tokenName(it.name)] = it.expression.getText(root)
          return
        }
        obj[tokenName(it.name)] = "<...>"
      })
      return obj
    }
    switch (arg.kind) {
      case ts.SyntaxKind.TrueKeyword:
        return "true"
      case ts.SyntaxKind.FalseKeyword:
        return "false"
      case ts.SyntaxKind.NullKeyword:
        return "null"
    }
    return `<${ts.SyntaxKind[arg.kind]}>`
  })

  return {
    kind: "decorator",
    name: `${expr.escapedText}`,
    args: args
  }
}

export function parameter(node: ts.ParameterDeclaration, root: ts.SourceFile): TsDoxParameter {
  const tags = ts.getJSDocParameterTags(node)
  return {
    kind: "parameter",
    name: tokenName(node.name),
    type: typeName(node.type),
    summary: tags && tags.length ? tags[0].comment : "",
    isOptional: !!node.questionToken,
    isSpread: !!node.dotDotDotToken,
  }
}

export function makeVariable(node: ts.VariableDeclaration, root: ts.SourceFile): TsDoxVariable {
  const flags = ts.getCombinedNodeFlags(node)
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "variable",
    name: tokenName(node.name),
    type: typeName(node.type),
    signature: root.getFullText().substring(node.getStart(root, false), node.end),
    summary: summary(node, root),
    docs: jsdoc(node),
    isConst: !!(flags & ts.NodeFlags.Const),
    isLet: !!(flags & ts.NodeFlags.Let),
  }
}

export function makeType(node: ts.TypeAliasDeclaration, root: ts.SourceFile): TsDoxType {
  const flags = ts.getCombinedNodeFlags(node)
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    location: location(node, root),
    kind: "type",
    name: tokenName(node.name),
    signature: root.getFullText().substring(node.getStart(root, false), node.end),
    summary: summary(node, root),
    docs: jsdoc(node),
  }
}

export function makeFunction(node: ts.FunctionDeclaration, root: ts.SourceFile): TsDoxFunction {
  const start = node.getStart(root, false)
  const end = node.body ? node.body.getStart(root, false) : node.getEnd()
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    location: location(node, root),
    kind: "function",
    name: tokenName(node.name),
    signature: root.getFullText().substring(start, end),
    returnType: typeName(node.type),
    summary: summary(node, root),
    docs: jsdoc(node),
    parameters: node.parameters.map((it) => parameter(it, root)),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, root))
  }
}

export function makeConstructor(node: ts.ConstructorDeclaration, root: ts.SourceFile): TsDoxConstructor {
  const start = node.getStart(root, false)
  const end = node.body ? node.body.getStart(root, false) : node.getEnd()
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    location: location(node, root),
    kind: "constructor",
    name: "__constructor",
    signature: root.getFullText().substring(start, end),
    returnType: typeName(node.type),
    summary: summary(node, root),
    docs: jsdoc(node),
    parameters: node.parameters.map((it) => parameter(it, root)),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, root))
  }
}

export function makeMethod(node: ts.MethodDeclaration | ts.MethodSignature, root: ts.SourceFile): TsDoxMethod {
  const start = node.getStart(root, false)
  let end = node.getEnd()
  if (ts.isMethodDeclaration(node) && node.body) {
    end = node.body.getStart(root)
  }
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    location: location(node, root),
    kind: "method",
    name: tokenName(node.name),
    signature: root.getFullText().substring(start, end),
    returnType: typeName(node.type),
    summary: summary(node, root),
    docs: jsdoc(node),
    parameters: node.parameters.map((it) => parameter(it, root)),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, root))
  }
}

export function makeProperty(
  node: ts.PropertyDeclaration | ts.PropertySignature | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration,
  root: ts.SourceFile,
): TsDoxProperty {
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "property",
    name: tokenName(node.name),
    returnType: typeName(node.type),
    summary: summary(node, root),
    docs: jsdoc(node),
    isOptional: !!node.questionToken,
    isGetter: ts.isGetAccessorDeclaration(node),
    isSetter: ts.isGetAccessorDeclaration(node),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, root))
  }
}

export function makeModule(node: ts.ModuleDeclaration, root: ts.SourceFile) {
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "module",
    name: node.name.text,
    location: location(node, root),
    summary: summary(node, root),
    docs: jsdoc(node),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, root))
  }
}

export function makeClass(node: ts.ClassDeclaration, root: ts.SourceFile): TsDoxClass {
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "class",
    name: node.name.text,
    location: location(node, root),
    summary: summary(node, root),
    docs: jsdoc(node),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, root)),
    methods: {},
    properties: {}
  }
}

export function makeInterface(node: ts.InterfaceDeclaration, root: ts.SourceFile): TsDoxInterface {
  const result: TsDoxInterface = {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "interface",
    name: node.name.text,
    location: location(node, root),
    summary: summary(node, root),
    docs: jsdoc(node),
    properties: {},
    methods: {}
  }
  return result
}

export function makeEnum(node: ts.EnumDeclaration, root: ts.SourceFile): TsDoxEnum {
  const result: TsDoxEnum = {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "enum",
    name: node.name.text,
    location: location(node, root),
    summary: summary(node, root),
    docs: jsdoc(node),
    members: node.members.map((it) => {
      return {
        name: tokenName(it.name),
        value: it.initializer ? it.initializer.getText() : "",
        summary: summary(it, root),
        docs: jsdoc(it),
      }
    })
  }
  return result
}

export function walk(root: ts.SourceFile, node: ts.Node, out: any) {
  ts.forEachChild(node, (it) => {
    visit(root, it, out)
    return false // false, to keep iterating
  })
  return out
}

export function visit(root: ts.SourceFile, node: ts.Node, out: any) {

  if (ts.isModuleDeclaration(node)) {
    const data = makeModule(node, root)
    out.modules = out.modules || {}
    out.modules[data.name] = walk(root, node, data)
    return
  }

  if (ts.isFunctionDeclaration(node)) {
    const data = makeFunction(node, root)
    if (data.isExported) {
      out.functions = out.functions || {}
      out.functions[data.name] = data
    }
    return
  }

  if (ts.isVariableDeclaration(node)) {
    const data = makeVariable(node, root)
    if (data.isExported) {
      out.variables = out.variables || {}
      out.variables[data.name] = data
    }
    return
  }

  if (ts.isTypeAliasDeclaration(node)) {
    const data = makeType(node, root)
    if (data.isExported) {
      out.types = out.types || {}
      out.types[data.name] = data
    }
  }

  if (ts.isClassDeclaration(node)) {
    const data = makeClass(node, root)
    if (data.isExported) {
      out.classes = out.classes || {}
      out.classes[data.name] = walk(root, node, data)
    }
    return
  }

  if (ts.isInterfaceDeclaration(node)) {
    const data = makeInterface(node, root)
    if (data.isExported) {
      out.interfaces = out.interfaces || {}
      out.interfaces[data.name] = walk(root, node, data)
    }
    return
  }

  if (ts.isEnumDeclaration(node)) {
    const data = makeEnum(node, root)
    if (data.isExported) {
      out.enums = out.enums || {}
      out.enums[data.name] = data
    }
    return
  }

  if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
    const data = makeProperty(node, root)
    if (!data.isPrivate) {
      out.properties = out.properties || {}
      if (!out.properties[data.name] || ts.isGetAccessorDeclaration(node)) {
        out.properties[data.name] = data
      }
    }
    return
  }

  if (ts.isConstructorDeclaration(node)) {
    out.constructor = makeConstructor(node, root)
    return
  }

  if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
    const data = makeMethod(node, root)
    if (!data.isPrivate) {
      out.methods = out.methods || {}
      out.methods[data.name] = data
    }
    return
  }

  if (ts.isSourceFile(node)) {
    out.name = location(node, root).file
    out.modules = out.modules || {}
    out.classes = out.classes || {}
    out.interfaces = out.interfaces || {}
    out.functions = out.functions || {}
    out.enums = out.enums || {}
    out.variables = out.variables || {}
    out.types = out.types || {}
  }

  return walk(root, node, out)
}
