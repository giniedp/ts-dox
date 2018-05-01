"use strict"

const gulp = require("gulp")
const dox = require("./lib")

gulp.task("docs", () => {
  gulp
    .src("src/**/*.ts")
    .pipe(dox.transform({
      concat: "api.json",
      spacer: "\t",
    }))
    .pipe(gulp.dest("doc"))
    .pipe(dox.transformMarkdown())
    .pipe(gulp.dest("doc/markdown"))
})
