#!/usr/bin/env node

const Lexer = require('lex')

let lexer = new Lexer;

let root = {children: [], type: 'root'}
let lastNode = root

// Lexer Macro Rules

lexer.addRule(/\\section\s?\([^\n)]+\)\s*/, (text) => {
   let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())

   lastNode.children.push({type: 'section', name: args[0], args: args.slice(1), variables: [], children: [], parentNode: lastNode})
})

lexer.addRule(/\\set\s?\([^\n)]+\)/, (text) => {
   // set can't have any children
   lastNode.children.push({type: 'set', text: text.slice(text.indexOf('(') + 1)})
})

lexer.addRule(/\\nav\s?\([^\n)]+\)\s*/, (text) => {
   let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
   
   lastNode.children.push({type: 'nav', name: args[0], args: args.slice(1), children: [], parentNode: lastNode})
})

lexer.addRule(/\\show\s?\([^\n)]+\)\s*/, (text) => {
   let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())

   lastNode.children.push({type: 'show', name: args[0],
      preserveLinkText: args[1], args: args.slice(2), children: [], parentNode: lastNode})
})

lexer.addRule(/\\include\s?\([^\n)]+\)\s*/, (text) => {
   let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
   
   lastNode.children.push({type: 'include', name: args[0], args: args.slice(1), children: [], parentNode: lastNode})
})

lexer.addRule(/\\if\s?\([^\n)]+\)\s*/, (text) => {
   let condition = text.slice(text.indexOf('(') + 1, text.indexOf(')'))

   lastNode.children.push({type: 'if', condition: condition, children: [], parentNode: lastNode})
})

lexer.addRule(/\\else\s*/, (text) => {
   //TODO make sure there's an if block before the else
   lastNode.children.push({type: 'else', condition: condition, children: [], parentNode: lastNode})
})


lexer.addRule(/\\choices\s*/, (text) => {
   lastNode.children.push({type: 'choices', children: [], parentNode: lastNode})
})

// Text modifiers

lexer.addRule(/\\h1\s*/, () => {
   lastNode.children.push({type: 'h1', children: [], parentNode: lastNode})
})

lexer.addRule(/\\h2\s*/, () => {
   lastNode.children.push({type: 'h2', children: [], parentNode: lastNode})
})


lexer.addRule(/\\em\s*/, () => {
   lastNode.children.push({type: 'em', children: [], parentNode: lastNode})
})

lexer.addRule(/\\bf\s*/, () => {
   lastNode.children.push({type: 'bf', children: [], parentNode: lastNode})
})

// Brackets
lexer.addRule(/(\s|\n)*\{/, () => {
   if (lastNode.children.length < 1) throw "Cannot begin block. Your brackets are likely unbalanced"
   if (lastNode.type === 'text') throw "Invalid { following text block"
   lastNode = lastNode.children[lastNode.children.length -1]
})

lexer.addRule(/\}/, () => {
   if (lastNode.type === 'root') "Cannot end block. Your brackets are likely unbalanced"
   lastNode = lastNode.parentNode
})

// Text
lexer.addRule(/[^(\n\n){}]+/, (text) => {
   // text can't have children
   lastNode.children.push({type: 'text', 'text': text, parentNode: lastNode})
})

// Newline
lexer.addRule(/\n(\n+)/, () => {
   lastNode.children.push({type: 'lineBreak', parentNode: lastNode})
})


let syntaxTree = lexer.setInput('\\section(testSection) {\\h2 {heading 2} }').lex()

// 2 types of processing
//   1. process node itself
//   2. process list of children

// Handling set and if together is going to be tricky

function process(node) {
   switch(node.type) {
      case 'root': return processRoot(node); break;
      case 'section': return processSection(node); break;
      case 'h1': return processH1(node); break;
      case 'h2': return processH2(node); break;
      case 'text': return node.text; break;
   }
}

function processH1(node) {
   let content = node.children.map(n => process(n)).reduce((acc, n) => acc + n, '')
   return `<h1>${content}</h1>`
}

function processH2(node) {
   let content = node.children.map(n => process(n)).reduce((acc, n) => acc + n, '')
   return `<h2>${content}</h2>`
}


function processEM(node) {
   let content = node.children.map(n => process(n)).reduce((acc, n) => acc + n, '')
   return `<em>${content}</em>`
}

function processBF(node) {
   let content = node.children.map(n => process(n)).reduce((acc, n) => acc + n, '')
   return `<strong>${content}</strong>`
}

function processSection(section) {
  // first let's process each of the child nodes
  let children = section.children.map(n => process(n))
  // now we need to iterate through them and group them into 
  
  return `function ${section.name}(${section.args.join(',')}) { ${section.variables.join(';')}; return \`${content}\` }`
}

function processNav(node) {
  let content = node.children.map(n => process(n)).reduce((acc, n) => acc + n, '')
  return `<a onclick="navigate(${node.name}(${node.args.join(',')}))">${content}</a>`
}

function processShow(node) {
  let content = node.children.map(n => process(n)).reduce((acc, n) => acc + n, '')
  return `<a onclick="show(${node.name}(${node.args.join(',')}), node.preserveLinkText)">${content}</a>`
}

function processRoot(root) {
   return  root.children.map(n => process(n)).reduce((acc, n) => acc + n + '\n', '')
}

console.log(root.children)
console.log(process(root))
