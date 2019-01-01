/**
 * Take an input string and convert it into a syntax tree
 * @param input the input file
 * @return the root tag of the syntax tree
 */
function lex(input: string): Tag {
    let root = new Root()
    let lastNode = root

    let i: number = 0;
    while (i < input.length) {
        // things that always get handled the same happen here
        if (input[i] === '{') {
           if (lastNode.children.length < 1) throw "Cannot begin block. Your brackets are likely unbalanced"
           if (lastNode.children[lastNode.children.length -1].children == null) throw "Invalid { following a terminal symbol"
           lastNode = lastNode.children[lastNode.children.length -1]
           i++
        } else if (input[i] === '}') {
            if (lastNode instanceof Text) "Cannot end block. Your brackets are likely unbalanced"
            lastNode = lastNode['parent']
            i++
        } else {
            // apply rules based on the type of lastNode
            let lexmap = {
                    'Root': lexRoot, 
                    'Section': lexBlock, 
                    'Navigate': lexBlock,
                    'Choices': lexChoices,
                    'Choice': lexBlock,
                    'Show': lexBlock,
                    'If': lexBlock,
                    'Else': lexBlock,
                    'H1': lexBlock,
                    'H2': lexBlock,
                    'BF': lexBlock,
                    'EM': lexBlock,
            }

            if (!Object.keys(lexmap).includes(lastNode.constructor.name)) throw `Cannot add block after ${lastNode.constructor.name}`
            i = lexmap[lastNode.constructor.name](input, i, lastNode)
        }
    }

    return root
}

function lexChoices(input: string, i: number, lastNode: Tag): number {
    // throw away newlines and spaces
    if (input[i] === '\n' || input[i] === ' ') { return i + 1 }
    else if (input.startsWith('\\choice', i)) {
        let text = input.slice(i).match(/\\choice\s?\([^\n)]+\)\s*/)[0]
        if (text == null) throw `Invalid \\choice expression at ${i}`

        let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
        lastNode.children.push(new Choice(args[0], args.slice(2), args[1] === 'true', lastNode))

        // skip to the next open bracket
        return input.indexOf('{', i)
    }
    else throw "Invalid text within choices block."
}


/**
 * Handles the lexing within a Root node
 * @param input the input file
 * @param i current index into the file
 * @param lastNode the current parent node
 * @return the new index after parsing the block
 */
function lexRoot(input: string, i: number, lastNode: Tag): number {
    // throw away newlines and spaces
    if (input[i] === '\n' || input[i] === ' ') { return i + 1 }
    else if (input.startsWith('\\section', i)) {
        // what we do if we find a section
        let text = input.slice(i, input.indexOf(')', i) + 1)
        let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
        lastNode.children.push(new Section(args[0], args.slice(1), [], lastNode))
        
        // update our index to after the section text
        return input.indexOf(')', i) + 1
    }
    else if (input.startsWith('\\title', i)) {
        let title = input.slice(input.indexOf('(', i) + 1, input.indexOf(')', i)); 
        (lastNode as Root).title = title

        // update our index to after the section text
        return input.indexOf(')', i) + 1
    }
    else if (input.startsWith('\\set', i)) {
        let text = input.slice(i).match(/\\set\s?\([^\n)]+\)/)[0]
        if (text == null) throw `Invalid \\set expression at ${i}`

        // grab the body of the set statement
        let variable = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())

        // doesn't really make sense to do if/else in the root section
        // so we won't check for it

        if (!(lastNode instanceof Root)) 
            throw "lexRoot function called on non root node. Check your syntax and brackets.";
        
        (lastNode as Root).variables.push(`${variable};`)
        
        //NOTE we return a different value if we have a set statement because set statements don't have { }
        return input.indexOf(')',i) + 1
    }
    else if (input.startsWith('\\script', i)) { return lexScript(input, i, lastNode) }
    else if (input.startsWith('\\style', i)) { return lexStyle(input, i, lastNode) }
    else { throw `Unexpected character ${input[i]}` }
}

function lexScript(input: string, i: number, lastNode: Tag): number {
    let script;
    [i, script] = lexScriptOrStyle(input, i)
    if (lastNode instanceof Section || lastNode instanceof Root)
        lastNode.script.push(script)
    else throw `Cannot add script within node ${lastNode.constructor.name}`
    return i
}

function lexStyle(input: string, i: number, lastNode: Tag): number {
    let [j, style] = lexScriptOrStyle(input, i)
    if (lastNode instanceof Section || lastNode instanceof Root)
        lastNode.style.push(style)
    else throw `Cannot add style within node ${lastNode.constructor.name}`
    return j
}


function lexScriptOrStyle(input: string, i: number): [number, string] {
    i = input.indexOf('{', i) + 1
    let buffer = ''
    let bracket = 1

    for (; bracket > 0; i++) {
        if (input[i] === '{') bracket++;
        else if (input[i] === '}') bracket--;
        buffer += input[i]
    }

    // chop off the last bracket
    buffer = buffer.slice(0, buffer.length - 1)

    return [i, buffer]
}

/**
 * Handles the lexing within a Block node. This is done within the brackets of a
 * section or command node
 * @param input the input file
 * @param i current index into the file
 * @param lastNode the current parent node
 * @return the new index after parsing the block
 */
function lexBlock(input: string, i: number, lastNode: Tag): number {
    //TODO do we need to do anything to handle 3+ newlines
    if (input[i] === '\n' && input[i+1] === '\n') {
        lastNode.children.push(new LineBreak(lastNode))
        return i + 2
    }
    // handle possible commands
    if (input[i] === '\\') {
        if (input.startsWith('\\h1', i)) { lastNode.children.push(new H1(lastNode)) }
        else if (input.startsWith('\\h2', i)) { lastNode.children.push(new H2(lastNode)) }
        else if (input.startsWith('\\bf', i)) { lastNode.children.push(new BF(lastNode)) }
        else if (input.startsWith('\\em', i)) { lastNode.children.push(new EM(lastNode)) }
        else if (input.startsWith('\\choices', i)) { lastNode.children.push(new Choices(lastNode)) }
        // script and style are special because they update i themselves
        else if (input.startsWith('\\script', i)) { return lexScript(input, i, lastNode) }
        else if (input.startsWith('\\style', i)) { return lexStyle(input, i, lastNode) }
        // handle set statements
        else if (input.startsWith('\\set', i)) {
            let text = input.slice(i).match(/\\set\s?\([^\n)]+\)/)[0]
            if (text == null) throw `Invalid \\set expression at ${i}`

            // grab the body of the set statement
            let variable = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())

            // walk up the tree looking for if statements
            let conditions = []
            let node: Tag = lastNode
            for (; !(node instanceof Section); node = node.parent) {
                if (node instanceof If) conditions.push(node.condition)
                else if (node instanceof Else) conditions.push(`!(${node.iftag.condition})`)
            }
            
            // if we found some if statements, we need to only set the variable if they are met
            if (conditions.length > 0) {
                let condition = conditions[0] + conditions.slice(1).reduce((acc, c) => acc + ' && ' + c , '')
                node.variables.push(`if (${condition}) ${variable}; `)
            } else {
                node.variables.push(`${variable};`)
            }
            //NOTE we return a different value if we have a set statement because set statements don't have { }
            return input.indexOf(')',i) + 1
        }
        else if (input.startsWith('\\nav', i)) {
            let text = input.slice(i).match(/\\nav\s?\([^\n)]+\)\s*/)[0]
            if (text == null) throw `Invalid \\nav expression at ${i}`

            let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
            lastNode.children.push(new Navigate(args[0], args.slice(1), lastNode))
        }
        else if (input.startsWith('\\show', i)) {
            let text = input.slice(i).match(/\\show\s?\([^\n)]+\)\s*/)[0]
            if (text == null) throw `Invalid \\show expression at ${i}`

            let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
            lastNode.children.push(new Show(args[0], args.slice(2), args[1] === 'true', lastNode))
        }
        else if (input.startsWith('\\print', i)) {
            let text = input.slice(i).match(/\\print\s?\([^\n)]+\)\s*/)[0]
            if (text == null) throw `Invalid \\print expression at ${i}`

            let variable = text.slice(text.indexOf('(') + 1, text.indexOf(')')).trim()
            lastNode.children.push(new Print(variable, lastNode))

            //NOTE we return a different value if we have a print statement because set statements don't have { }
            return input.indexOf(')',i) + 1
        }
        else if (input.startsWith('\\include', i)) {
            let text = input.slice(i).match(/\\include\s?\([^\n)]+\)\s*/)[0]
            if (text == null) throw `Invalid \\include expression at ${i}`

            let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
            lastNode.children.push(new Include(args[0], args.slice(1), lastNode))

            //NOTE we return a different value if we have a include statement because image statements don't have { }
            return input.indexOf(')',i) + 1
        }
        else if (input.startsWith('\\input', i)) {
            let text = input.slice(i).match(/\\input\s?\([^\n)]+\)\s*/)[0]
            if (text == null) throw `Invalid \\input expression at ${i}`

            let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
            lastNode.children.push(new Input(args[0], args[1], (args.length > 2 ? args[2] : ''), lastNode))

            //NOTE we return a different value if we have a input statement because image statements don't have { }
            return input.indexOf(')',i) + 1
        }
        else if (input.startsWith('\\image', i)) {
            let text = input.slice(i).match(/\\image\s?\([^\n)]+\)\s*/)[0]
            if (text == null) throw `Invalid \\image expression at ${i}`
            
            let args = text.slice(text.indexOf('(') + 1, text.indexOf(')')).split(',').map(i => i.trim())
            lastNode.children.push(new Image(args[0], args[1], args[2], args[3], lastNode))

            //NOTE we return a different value if we have a print statement because image statements don't have { }
            return input.indexOf(')',i) + 1
        }
        else if (input.startsWith('\\if', i)) {
            let text = input.slice(i).match(/\\if\s?\([^\n)]+\)\s*/)[0]
            let condition = text.slice(text.indexOf('(') + 1, text.indexOf(')'))

            lastNode.children.push(new If(condition, lastNode))
        }
        else if (input.startsWith('\\else', i)) {
            let text = input.slice(i).match(/\\else\s*/)[0]
            
            let foundIf = false
            for (let j = lastNode.children.length - 1; j >= 0; j--) {
                let node = lastNode.children[j]
                if (node instanceof Else) throw "Found double else block";
                if (node instanceof If) {
                    let elseBlock = new Else(node, lastNode)
                    lastNode.children.push(elseBlock)
                    foundIf = true
                    break
                }
            }
            
            if (!foundIf) throw "Found else block with no If block"
        }
        else throw `Invalid command`

        // skip to the next open bracket
        return input.indexOf('{', i)
    } else {
        // parse the text, yo
        let buffer = ''
        let j = i

        for (j = i; !(input[j] === '\n' && input[j+1] === '\n') && input[j] !== '\\' && input[j] !== '}'; j++) {
            buffer += input[j]
        }
       
        // we don't want to create empty nodes or nodes only containing newlines and spaces
        if (buffer.match(/^(\n|\s)*$/) === null && buffer !== '')
            lastNode.children.push(new Text(buffer, lastNode))
        return j
    }
}


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
    process(): string { return '<br/>' }
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
        return `<strong>${content}</strong>`
    }
}

class If {
    constructor(public condition: string, public parent: Tag) {}
    
    public children: Tag[] = []
    public elseBlock?: Else = null

    process(): string {
        let elseContent = ''
        if (this.elseBlock !== null)
            elseContent = this.elseBlock.children.map(n => n.process()).reduce((acc, n) => acc + n, '')

        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        if (content.trim()) return `\${${this.condition} ? \`${content}\` : \`${elseContent}\`}`
        else return ''
    }
}

// The else block doesn't really do anything but hold children
// The If class looks ahead to find else content and process it
class Else {
    constructor(public iftag: If, public parent: Tag) {
        iftag.elseBlock = this
    }
    
    public children: Tag[] = []

    process(): string { return '' }
}


class Section {
    constructor(public name: string, public args: string[], 
                public variables: string[], public parent: Tag) {}
    
    public children: Tag[] = []
    public style?: string[] = []
    public script?: string[] = []
    
    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        let styleCode = ''
        if (this.style.length > 0) {
            let style = this.style.filter(s => s !== '').join('').replace(/\n/g, '')
            styleCode = `<style type="text/css">${style}</style>`
        }
        return `function ${this.name}(${this.args.join(',')}) { ${this.script.join(';')}; 
            ${this.variables.join(';')}; return \`${styleCode}${content}\` }`
    }
}

class Include {
    constructor(public name: string, public args: string[], 
                public parent: Tag) {}

                public children: Tag[] = null


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
                    return `<a onclick="show(this, ${this.name}, [${this.args.join(',')}], ${this.preserveLinkText})">${content}</a>`
                }
}

class Print {
    constructor(public variable: string, public parent: Tag) {}

    public children: Tag[] = null

    process(): string {
        return `\${${this.variable}}`
    }
}

class Image {
    constructor(public url: string, private height: string, 
                private width: string, private alt: string, public parent: Tag) {}

                public children: Tag[] = null

                process(): string {
                    return `<img src="${this.url}" alt="${this.alt}" style="height: ${this.height}; width: ${this.width};"/>`
                }
}

class Input {
    constructor(private type: string, private variableName: string, 
                private placeHolder: string, public parent: Tag) {}
    
    public children: Tag[] = null

    process(): string {
        return `<input onkeyup="${this.variableName} = this.value" type="${this.type}" placeholder="${this.placeHolder}"`
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

class Choice {
    constructor(public name: string, public args: string[], public preserveLinkText: boolean, 
                public parent: Tag) {}

    public children: Tag[] = []

    process(): string {
        let content = this.children.map(n => n.process()).reduce((acc, n) => acc + n, '')
        return `<a onclick="choice(this, ${this.name}, [${this.args.join(',')}], ${this.preserveLinkText})">${content}</a>`
    }

}

class Root {
    children: Tag[] = []
    parent: Tag = null
    title?: string
    public variables?: string[] = []
    public style?: string[] = []
    public script?: string[] = []

    process(): string {
        let stylecode = ''
        if (this.style.length > 0) {
            let style = this.style.filter(s => s !== '').join('').replace(/\n/g, '')
            stylecode = `addStyle('${style}')`
        }
        return this.variables.join(';') + ';' + this.script.join(';') + ';' + stylecode + ';' +
            this.children.map(n => n.process()).reduce((acc, n) => acc + n + '\n', '')
    }
}

let root = new Root();
let lastNode = root

export class Output {
    constructor(public content: string, public title: string) {}
}

export function compile(input: string): Output {
  root = lex(input)
  return new Output(root.process(), root.title || '')
}
