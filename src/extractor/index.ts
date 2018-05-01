import * as fs from "fs"
import * as path from "path"
import * as ts from "typescript"
import { visit } from "./lib"
import { Transform } from "stream"

/**
 * Parses the given file and extracts typescript AST as JSON
 *
 * @param file Path to the file
 * @param text The file content
 */
export function extract(file: string, text?: string, program?: ts.Program) {
  if (!text) {
    text = fs.readFileSync(file).toString()
  }
  const src = ts.createSourceFile(file, text, ts.ScriptTarget.ES2015, true)
  return visit({
    src: src,
    node: src,
    output: {},
    program: program,
  })
}

function transformFile(options: {
  concat?: string,
  map?: (input: any) => any,
  spacer?: number | string
} = {}) {
  return function(file, encoding, cb) {
    const json = extract(file.path, file.contents.toString())
    const mapped = options.map ? options.map(json) : json
    const text = JSON.stringify(mapped, null, options.spacer || 0)
    file.path = file.path.replace(/\.(ts|js|tsx)$/, ".json")
    file.contents = new Buffer(text)
    cb(null, file)
  }
}

/**
 * Creates a Transform object for eaxmple to be used in a gulp pipeline
 */
export function transform(options: {
  concat?: string,
  map?: (input: any) => any,
  spacer?: number | string
} = {}) {

  if (!options.concat) {
    return new Transform({ objectMode: true, transform: transformFile(options) })
  }

  const files = []
  function buffer(file, encoding, cb) {
    transformFile(options)(file, encoding, () => {
      files.push(file)
      cb()
    })
  }
  function flush(cb) {
    const json = files
      .sort((a, b) => a.path < b.path ? -1 : 1)
      .map((f) => JSON.parse(f.contents.toString()))
    const text = JSON.stringify(json, null, options.spacer || 0)

    if (!files.length) {
      cb(null)
      return
    }

    const file = files[0]
    files.length = 0
    file.path = path.join(file.base, options.concat)
    file.contents = new Buffer(text)
    cb(null, file)
  }
  return new Transform({
    objectMode: true,
    transform: buffer,
    flush: flush
  })
}
