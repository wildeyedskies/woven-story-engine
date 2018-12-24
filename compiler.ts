#!/usr/bin/env node

import * as Lexer from 'lex'

let lexer = new Lexer;



// Lexer Macro Rules

lexer.addRule(/[\n\s]*\\section\s?\([^\n)]+\)\s*/, (text) => {
   let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())

   lastNode.children.push(new Section(args[0], args.slice(1), [], lastNode))
})

lexer.addRule(/\\set\s?\([^\n)]+\)\n*/, (text) => {
    // grab the body of the set statement
    let variable = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())

    // walk up the tree looking for if statements
    let conditions = []
    let node: Tag = lastNode
    for (; !(node instanceof Section); node = node.parent) {
        if (node instanceof If) conditions.push(node.condition)
        else if (node instanceof Else) conditions.push(`!(${node.condition})`)
        else if (node instanceof Root) throw "Cannot set variable outside a section. Not yet anyway"
    }
    
    // if we found some if statements, we need to only set the variable if they are met
    if (conditions.length > 0) {
        let condition = conditions[0] + conditions.slice(1).reduce((acc, c) => acc + ' && ' + c , '')
        node.variables.push(`if (${condition}) var ${variable}; `)
    } else {
        node.variables.push(`let ${variable};`)
    }
})

lexer.addRule(/\\nav\s?\([^\n)]+\)\s*/, (text) => {
   let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
   
   lastNode.children.push(new Navigate(args[0], args.slice(1), lastNode))
})

lexer.addRule(/\\show\s?\([^\n)]+\)\s*/, (text) => {
   let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())

   lastNode.children.push(new Show(args[0], args.slice(2), args[1], lastNode))
})

lexer.addRule(/\\print\s?\([^\n)]+\)\s*/, (text) => {
   let variable = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())

   lastNode.children.push(new Print(variable, lastNode))
})

lexer.addRule(/\\include\s?\([^\n)]+\)\s*/, (text) => {
   let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
   
   lastNode.children.push(new Include(args[0], args.slice(1), lastNode))
})

lexer.addRule(/\\if\s?\([^\n)]+\)\s*/, (text) => {
   let condition = text.slice(text.indexOf('(') + 1, text.indexOf(')'))

   lastNode.children.push(new If(condition, lastNode))
})

lexer.addRule(/\\else\s*/, (text) => {
   //make sure there's an if block before the else
   let foundIf = false;
   let condition = null;
   for (let node of lastNode.children.slice().reverse()) {
      if (node instanceof If) { foundIf = true; condition = node['condition']; break };
      if (node instanceof Else) throw 'Cannot have a double else block'
   }
   if (!foundIf) throw 'No corresponding if block found for else'

   lastNode.children.push(new Else(condition, lastNode))
})

lexer.addRule(/\\choices\s*/, (text) => {
   lastNode.children.push(new Choices(lastNode))
})

// Text modifiers

lexer.addRule(/\\h1\s*/, () => {
   lastNode.children.push(new H1(lastNode))
})

lexer.addRule(/\\h2\s*/, () => {
   lastNode.children.push(new H2(lastNode))
})


lexer.addRule(/\\em\s*/, () => {
   lastNode.children.push(new EM(lastNode))
})

lexer.addRule(/\\bf\s*/, () => {
   lastNode.children.push(new BF(lastNode))
})

// Brackets
// NOTE: Brackets do not add a representation to the syntax tree. All they do is shift the lastNode pointer
lexer.addRule(/[\n\s]*\{\n*/, () => {
   if (lastNode.children.length < 1) throw "Cannot begin block. Your brackets are likely unbalanced"
   if (lastNode instanceof Text) throw "Invalid { following text block"
   lastNode = lastNode.children[lastNode.children.length -1]
})

lexer.addRule(/\}\n*/, () => {
   if (lastNode instanceof Text) "Cannot end block. Your brackets are likely unbalanced"
   lastNode = lastNode['parent']
})

// Text
lexer.addRule(/[^(\n\n){}\\]+/, (text) => {
   // text can't have children
   lastNode.children.push(new Text(text, lastNode))
})

// Newline
lexer.addRule(/\n(\n+)/, () => {
   lastNode.children.push(new LineBreak(lastNode))
})

// 2 types of processing
//   1. process node itself
//   2. process list of children

// Handling set and if together is going to be tricky

interface Tag {
    process(): string
    children: Tag[]
    parent: Tag
}

class Text {
    constructor(public text: string, public parent: Tag) {}

    public children: Tag[] = null

    process(): string { return this.text }
}

class LineBreak {
    constructor(public parent: Tag) {}
    
    public children: Tag[] = null
    process(): string { return '' }
}

class H1 {
    constructor(public parent: Tag) {}
    
    public children: Tag[] = []

    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        return `<h1>${content}</h1>`
    }
}

class H2 {
    constructor(public parent: Tag) {}
    
    public children: Tag[] = []

    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        return `<h2>${content}</h2>`
    }
}

class EM {
    constructor(public parent: Tag) {}
    
    public children: Tag[] = []

    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        return `<em>${content}</em>`
    }
}

class BF {
    constructor(public parent: Tag) {}
    
    public children: Tag[] = []

    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        return `<bf>${content}</bf>`
    }
}

class If {
    constructor(public condition: string, public parent: Tag) {}
    
    public children: Tag[] = []

    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        if (content.trim()) return `\${if(${this.condition}) ${content}}`
        else return ''
    }
}

class Else {
    constructor(public condition: string, public parent: Tag) {}
    
    public children: Tag[] = []

    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        if (content.trim()) return `\${if(!(${this.condition})) ${content}}`
        else return ''
    }
}


class Section {
    constructor(public name: string, public args: string[], 
                public variables: string[], public parent: Tag) {}
    
    public children: Tag[] = []
    
    process(): string {
        // now we need to iterate through the children and group them into paragraphs
        let paragraphs: string[][] = [[]]; let paragraphIndex = 0
        this.children.forEach((childNode, index) => {
            if (childNode instanceof LineBreak) {
                paragraphIndex++
                paragraphs[paragraphIndex] = []
            }
            else paragraphs[paragraphIndex].push(childNode.process())
        })
        let content = paragraphs.reduce((acc, i) => acc + '<p>' + i.join('').replace('\n', ' ') + '</p>', '')

        return `function ${this.name}(${this.args.join(',')}) { ${this.variables.join(';')}; return \`${content}\` }`
    }
}

class Include {
    constructor(public name: string, public args: string[], 
                public parent: Tag) {}
    
    public children: Tag[] = []


    process(): string {
        // we want the template string to execute the included section function when the 
        // including section's function is called
        return `\${${this.name}(${this.args.join(',')})}`
    }
}

class Navigate {
    constructor(public name: string, public args: string[], 
                public parent: Tag) {}

    public children: Tag[] = []

    process(): string {
      let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
      return `<a onclick="navigate(${this.name}, [${this.args.join(',')}])">${content}</a>`
    }
}

class Show {
    constructor(public name: string, public args: string[], public preserveLinkText: boolean, 
                public parent: Tag) {}

    public children: Tag[] = []

    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        return `<a onclick="show(${this.name}, [${this.args.join(',')}], ${this.preserveLinkText})">${content}</a>`
    }
}

class Print {
    constructor(public variable: string, public parent: Tag) {}

    public children: Tag[] = null

    process(): string {
        return `\${${this.variable}}`
    }
}

class Choices {
    constructor(public parent: Tag) {}
    
    public children: Tag[] = []
    
    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        return `<div class="choices">${content}</div>`
    }
}

class Root {
    children: Tag[] = []
    parent: Tag = null

    process() {
        return  this.children.map(n => n.process()).reduce((acc, n) => acc + n + '\n', '')
    }
}

let root = new Root();
let lastNode = root

export function compile(input: string): string {
  root = new Root()
  lastNode = root

  lexer.setInput(input).lex()
  return root.process()
}
