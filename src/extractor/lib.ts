import * as ts from "typescript"
import * as path from "path"

import {
  TsDoxDecorator,
  TsDoxEnum,
  TsDoxAccessModifiers,
  TsDoxLocation,
  TsDoxFunction,
  TsDoxMethod,
  TsDoxProperty,
  TsDoxClass,
  TsDoxInterface,
  TsDoxParameter,
  TsDoxConstructor,
  TsDoxVariable,
  TsDoxType,
} from "../runtime"

export interface Ctx {
  src: ts.SourceFile
  node: ts.Node
  output: any
  program?: ts.Program
}

function withOutput(ctx: Ctx, out: any): Ctx {
  return {
    ...ctx,
    output: out
  }
}

function withNode(ctx: Ctx, node: ts.Node): Ctx {
  return {
    ...ctx,
    node: node
  }
}

/**
 * Walks all children of given node
 *
 * @param root The source file
 * @param node The node to walk
 * @param out The object to extract data to
 */
export function walk(ctx: Ctx) {
  ts.forEachChild(ctx.node, (it) => {
    visit(withNode(ctx, it))
    return false // false, to keep iterating
  })
  return ctx.output
}

/**
 * Visits a source node and extracts the AST
 *
 * @param root The source file
 * @param node The node to visit
 * @param out The object to extract to
 */
export function visit(ctx: Ctx) {
  const node = ctx.node
  const root = ctx.src
  const out = ctx.output

  if (ts.isModuleDeclaration(node)) {
    const data = makeModule(node, ctx)
    out.modules = out.modules || {}
    out.modules[data.name] = walk(withOutput(ctx, data))
    return
  }

  if (ts.isFunctionDeclaration(node)) {
    const data = makeFunction(node, ctx)
    if (data.isExported) {
      out.functions = out.functions || {}
      out.functions[data.name] = data
    }
    return
  }

  if (ts.isVariableDeclaration(node)) {
    const data = makeVariable(node, ctx)
    if (data.isExported) {
      out.variables = out.variables || {}
      out.variables[data.name] = data
    }
    return
  }

  if (ts.isTypeAliasDeclaration(node)) {
    const data = makeType(node, ctx)
    if (data.isExported) {
      out.types = out.types || {}
      out.types[data.name] = data
    }
  }

  if (ts.isClassDeclaration(node)) {
    const data = makeClass(node, ctx)
    if (data.isExported) {
      out.classes = out.classes || {}
      out.classes[data.name] = walk(withOutput(ctx, data))
    }
    return
  }

  if (ts.isInterfaceDeclaration(node)) {
    const data = makeInterface(node, ctx)
    if (data.isExported) {
      out.interfaces = out.interfaces || {}
      out.interfaces[data.name] = walk(withOutput(ctx, data))
    }
    return
  }

  if (ts.isEnumDeclaration(node)) {
    const data = makeEnum(node, ctx)
    if (data.isExported) {
      out.enums = out.enums || {}
      out.enums[data.name] = data
    }
    return
  }

  if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
    const data = makeProperty(node, ctx)
    if (!data.isPrivate) {
      out.properties = out.properties || {}
      if (!out.properties[data.name] || ts.isGetAccessorDeclaration(node)) {
        out.properties[data.name] = data
      }
    }
    return
  }

  if (ts.isConstructorDeclaration(node)) {
    out.constructor = makeConstructor(node, ctx)
    return
  }

  if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
    const data = makeMethod(node, ctx)
    if (!data.isPrivate) {
      out.methods = out.methods || {}
      out.methods[data.name] = data
    }
    return
  }

  if (ts.isSourceFile(node)) {
    out.name = location(node, ctx).file
    out.modules = out.modules || {}
    out.classes = out.classes || {}
    out.interfaces = out.interfaces || {}
    out.functions = out.functions || {}
    out.enums = out.enums || {}
    out.variables = out.variables || {}
    out.types = out.types || {}
  }

  return walk(ctx)
}


function location(node: ts.Node, ctx: Ctx): TsDoxLocation {
  const { line, character } = ctx.src.getLineAndCharacterOfPosition(node.getStart())
  return {
    line: line,
    character: character,
    file: path.relative(process.cwd(), ctx.src.fileName),
  }
}

// function remarks(node: ts.Node): string {
//   const doc = (ts.getJSDocTags(node) || []).find((it) => it.tagName.escapedText === "remarks")
//   return doc ? doc.comment.trim() : ""
// }

function entityAccess(flags: ts.ModifierFlags): TsDoxAccessModifiers {
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

function heritage(node: ts.ClassDeclaration | ts.InterfaceDeclaration) {
  const result = {
    extends: [],
    implements: [],
  }
  if (node.heritageClauses) {
    node.heritageClauses.forEach((it) => {
      it.types.forEach((typeNode) => {
        if (it.token == ts.SyntaxKind.ExtendsKeyword) {
          result.extends.push(typeName(typeNode))
        } else {
          result.implements.push(typeName(typeNode))
        }
      })
    })
  }
  return result
}

function summary(node: ts.Node, ctx: Ctx): string {
  const text = ctx.src.getFullText()
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

function jsdoc(node: ts.Node) {
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

function tokenName(node: ts.PropertyName | ts.Identifier | ts.StringLiteral | ts.NumericLiteral | ts.QualifiedName | ts.BindingName) {
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

function typeName(node: ts.TypeNode): string {
  if (!node) {
    return ""
  }

  if (ts.isArrayTypeNode(node)) {
    return `Array<${typeName(node.elementType)}>`
  }

  if (ts.isTupleTypeNode(node)) {
    return `[${node.elements.map(it => typeName(it))}]`
  }

  if (ts.isUnionTypeNode(node)) {
    return node.types.map(typeName).join(" | ")
  }
  if (ts.isTypeReferenceNode(node)) {
    let name = tokenName(node.typeName)
    if (node.typeArguments) {
      name += `<${node.typeArguments.map(it => typeName(it)).join(", ")}>`
    }
    return name
  }
  if (ts.isFunctionTypeNode(node)) {
    return node.getText()
  }
  if (ts.isTypeLiteralNode(node)) {
    return node.getText()
  }
  if (ts.isExpressionWithTypeArguments(node)) {
    return node.getText()
  }
  if (ts.isTypeOperatorNode(node)) {
    return node.getText()
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
  // console.warn("type not handeled:", ts.SyntaxKind[node.kind], node.getText())
  return ""
}

function makeDecorator(node: ts.Decorator, ctx: Ctx): TsDoxDecorator {
  const expr = node.expression["expression"] || {}
  const args = (node.expression["arguments"] || []).map((arg) => {
    if (ts.isStringLiteral(arg) || ts.isNumericLiteral(arg)) {
      return arg.getText(ctx.src)
    }
    if (ts.isObjectLiteralExpression(arg)) {
      const obj = {}
      arg.properties.forEach((it) => {
        if (ts.isPropertyAssignment(it)) {
          obj[tokenName(it.name)] = it.initializer.getText(ctx.src)
          return
        }
        if (ts.isSpreadAssignment(it)) {
          obj[tokenName(it.name)] = it.expression.getText(ctx.src)
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

function parameter(node: ts.ParameterDeclaration, ctx: Ctx): TsDoxParameter {
  const tags = ts.getJSDocParameterTags(node)
  const result: TsDoxParameter = {
    kind: "parameter",
    name: tokenName(node.name),
    type: typeName(node.type),
    summary: tags && tags.length ? String(tags[0].comment) : "",
  }
  if (node.questionToken) result.isOptional = true
  if (node.dotDotDotToken) result.isSpread = true
  return result
}

function makeVariable(node: ts.VariableDeclaration, ctx: Ctx): TsDoxVariable {
  const flags = ts.getCombinedNodeFlags(node)
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "variable",
    name: tokenName(node.name),
    type: typeName(node.type),
    signature: ctx.src.getFullText().substring(node.getStart(ctx.src, false), node.end),
    summary: summary(node, ctx),
    docs: jsdoc(node),
    isConst: !!(flags & ts.NodeFlags.Const),
    isLet: !!(flags & ts.NodeFlags.Let),
  }
}

function makeType(node: ts.TypeAliasDeclaration, ctx: Ctx): TsDoxType {
  const root = ctx.src
  const flags = ts.getCombinedNodeFlags(node)
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    location: location(node, ctx),
    kind: "type",
    name: tokenName(node.name),
    signature: root.getFullText().substring(node.getStart(root, false), node.end),
    summary: summary(node, ctx),
    docs: jsdoc(node),
  }
}

function makeFunction(node: ts.FunctionDeclaration, ctx: Ctx): TsDoxFunction {
  const root = ctx.src
  const start = node.getStart(root, false)
  const end = node.body ? node.body.getStart(root, false) : node.getEnd()
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    location: location(node, ctx),
    kind: "function",
    name: tokenName(node.name),
    signature: root.getFullText().substring(start, end),
    returnType: typeName(node.type),
    summary: summary(node, ctx),
    docs: jsdoc(node),
    parameters: node.parameters.map((it) => parameter(it, ctx)),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, ctx))
  }
}

function makeConstructor(node: ts.ConstructorDeclaration, ctx: Ctx): TsDoxConstructor {
  const root = ctx.src
  const start = node.getStart(root, false)
  const end = node.body ? node.body.getStart(root, false) : node.getEnd()
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    location: location(node, ctx),
    kind: "constructor",
    name: "__constructor",
    signature: root.getFullText().substring(start, end),
    returnType: typeName(node.type),
    summary: summary(node, ctx),
    docs: jsdoc(node),
    parameters: node.parameters.map((it) => parameter(it, ctx)),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, ctx))
  }
}

function makeMethod(node: ts.MethodDeclaration | ts.MethodSignature, ctx: Ctx): TsDoxMethod {
  const root = ctx.src
  const start = node.getStart(root, false)
  let end = node.getEnd()
  if (ts.isMethodDeclaration(node) && node.body) {
    end = node.body.getStart(root)
  }
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    location: location(node, ctx),
    kind: "method",
    name: tokenName(node.name),
    signature: root.getFullText().substring(start, end),
    returnType: typeName(node.type),
    summary: summary(node, ctx),
    docs: jsdoc(node),
    parameters: node.parameters.map((it) => parameter(it, ctx)),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, ctx))
  }
}

function makeProperty(
  node: ts.PropertyDeclaration | ts.PropertySignature | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration,
  ctx: Ctx,
): TsDoxProperty {
  const root = ctx.src
  const result: TsDoxProperty = {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "property",
    name: tokenName(node.name),
    returnType: typeName(node.type),
    summary: summary(node, ctx),
    docs: jsdoc(node),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, ctx))
  }
  if (node.questionToken) result.isOptional = true
  if (ts.isGetAccessorDeclaration(node)) result.isGetter = true
  if (ts.isSetAccessorDeclaration(node)) result.isSetter = true
  return result
}

function makeModule(node: ts.ModuleDeclaration, ctx: Ctx) {
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "module",
    name: node.name.text,
    location: location(node, ctx),
    summary: summary(node, ctx),
    docs: jsdoc(node),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, ctx))
  }
}

function makeClass(node: ts.ClassDeclaration, ctx: Ctx): TsDoxClass {
  return {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "class",
    ...heritage(node),
    name: node.name.text,
    location: location(node, ctx),
    summary: summary(node, ctx),
    docs: jsdoc(node),
    decorators: (node.decorators || [] as any).map((it) => makeDecorator(it, ctx)),
    methods: {},
    properties: {}
  }
}

function makeInterface(node: ts.InterfaceDeclaration, ctx: Ctx): TsDoxInterface {
  const result: TsDoxInterface = {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "interface",
    ...heritage(node),
    name: node.name.text,
    location: location(node, ctx),
    summary: summary(node, ctx),
    docs: jsdoc(node),
    properties: {},
    methods: {}
  }
  return result
}

function makeEnum(node: ts.EnumDeclaration, ctx: Ctx): TsDoxEnum {
  const result: TsDoxEnum = {
    ...entityAccess(ts.getCombinedModifierFlags(node)),
    kind: "enum",
    name: node.name.text,
    location: location(node, ctx),
    summary: summary(node, ctx),
    docs: jsdoc(node),
    members: node.members.map((it) => {
      return {
        name: tokenName(it.name),
        value: it.initializer ? it.initializer.getText() : "",
        summary: summary(it, ctx),
        docs: jsdoc(it),
      }
    })
  }
  return result
}
