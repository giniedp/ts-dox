import * as fs from "fs"
import * as ts from "typescript"
import * as doc from "./lib"

export function extract(srcFile: string | { path: string, contents: Buffer }, text?: string) {
  let file = srcFile as string

  if (srcFile["contents"] && !text) {
    text = srcFile["contents"]
    file = srcFile["path"]
  }
  if (text) {
    text = text.toString()
  }

  const src = ts.createSourceFile(file, text, ts.ScriptTarget.ES2015, true)
  return doc.walk(src, src, {})
}

export function cmd() {
  console.log(process.argv)
  const result = extract(process.argv[0])
  process.stdout.write(new Buffer(JSON.stringify(result, null, "  ")))
}
