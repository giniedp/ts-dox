# TsDox

TsDox is a utility to transform Typescript AST to JSON. It extracts classes, interfaces, methods, functions, properties, comments and decorator information.

There is no command line interface. The library is meant to be used with tools lke gulp or webpack to render project documentation pages. This project does not (yet) contain any gulp or webpack plugin or a rendering implementation. Since every project has differen requirements, this library will not aim to offer a "ready to use" solution for rendering the doc files.

Here is an example of a possible gulp processor

```js
const through = require("through2")
const path = require("path")
const tsdox = require("tsdox/extractor")

module.exports = () => {
  return through.obj(function (file, encoding, cb) {
    // convert a single file to json
    const json = tsdox.extract(file.path, file.contents.toString())
    // convert json to text
    const text = JSON.stringify(json, null, "  ")
    // transform file path and content
    file.path = file.path.replace(/\.ts$/, ".json")
    file.contents = new Buffer(text)
    // emit file
    cb(null, file)
  })
}
```

If you use typescript to write a documentation renderer, you can use the typings like this

```ts
import * as doc from "tsdox/runtime"

const docFile: doc.TsDoxFile = // use your tools to load the generated doc file
// docFile.classes
// docFile.interfaces
// docFile.functions
```
