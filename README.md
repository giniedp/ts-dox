# TsDox

TsDox is a utility to transform Typescript AST to JSON. It extracts the following data

* classes
* interfaces
* methods
* functions
* properties
* enums
* comments (grouped by JsDoc tags, but untransformed text)
* decorator

There is no command line interface. The library is meant to be used with tools lke gulp or webpack to render project documentation pages. Since every project has differen requirements, this library will not aim to offer a "ready to use" solution for rendering the doc files.

An example how to use it with

```js
const path = require("path")
const tsdox = require("tsdox")

gulp
  .src("**/*.ts")
  .pipe(tsdox.transform())
  // or if you want to concat all the files into a single json, use
  // .pipe(tsdox.transform({ concat: "api.json" }))
  .pipe(gulp.dest("dist"))
```

If you use typescript to write a documentation renderer, you can use the typings like this

```ts
import {
  TsDoxFile,
  TsDoxClass,
  TsDoxInterface,
  TsDoxFunction,
  TsDoxMethod,
  TsDoxConstructor,
  TsDoxProperty,
  TsDoxParameter,
  TsDoxModifiers,
} from "tsdox/lib/runtime"
```
