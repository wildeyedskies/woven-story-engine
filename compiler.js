#!/usr/bin/env node
let parser = require("./parser.js").parser
let fs = require("fs")
let minify = require('html-minifier').minify;

function main() {
    if (process.argv.length < 2) {
        console.log("usage: compiler.js [input file] [output file]")
        process.exit(1)
    }
    let inputFile = process.argv[2]
    let outputFile = process.argv[3]

    fs.readFile(inputFile, 'utf8', (err,data) => {
        if (err) throw err
        let output = parser.parse(data)

        fs.readFile("template.html", 'utf8', (err,template) => {
            if (err) throw err
            writeOutput(minifyOutput(template.replace("%%content%%", output)), outputFile)
        })
    })

}

function minifyOutput(output) {
    return minify(output, {
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        removeEmptyAttributes: true
    })
}

function writeOutput(output, outputFile) {
    fs.writeFile(outputFile, output, 'utf8', (err) => {
        if (err) throw err
    })
}


main()
