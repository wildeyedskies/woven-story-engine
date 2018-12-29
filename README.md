# Woven Story Engine

A twine like interactive fiction engine, written for my game The Library

Woven provides a clean syntax somewhat inspired by LaTeX, and a set of neat macros to help you make your
story interactive.

That being said Woven is brand new, written by a single, somewhat inexperienced developer. There are going to be
bugs.

## Installing

To use the library engine you will need node JS, the yarn packagemanager and the typescript compiler.

1. NodeJS can be installed installed from [here](https://nodejs.org/en/), or installed via a package manager if you are on a linux/bsd.
2. Yarn can be installed from [here](https://yarnpkg.com/en/)
3. Install typescript with yarn `yarn global add typescript`
4. Clone the repo and run `yarn install`

## Usage

To compile the system run `tsc` Note that you may have to add the yarn bin directory to your `PATH` variable.

To compile a story from the command line run `node cli.js <story file> <output html file>`

## Syntax

Woven stories are made up of sections. Sections can be navigated to or included within other sections. When loaded,
woven automatically attempts to display the section called main.

### Section

Sections are the basic building blocks of Woven stories.

`\section(name[, anguments]) { text }`

Sections can optionally take arguments which can then be used with `\if` `\else` and `\print` to determine
how the text will be rendered. Note that section arguments are interpreted by javascript, meaning that strings
need to be enclosed with quotes. Note: only single quotes are supported, double quotes will break the system.

#### Example

```
\section(main) {
Welcome to the main section 

\nav(sectionTwo, 'amazing!') { Continue }
}

\section(sectionTwo, look) { You look \print(look) }
```

When the user presses continue, the program will output `You look amazing!` 

### Title

`\title(text)`

Title sets the title of the story that will display in the browser's tab header.

### Nav

Navigate to a new section I.E., replace what is currently on the screen.

`\nav(sectionName[, arguments]) { link text }`

### Show

Add the contents of a section to the existing section. preserveLinkText determines whether the link text remains
on screen when the link is clicked. Valid values for preserveLinkText are `true` and `false`.

`\show(sectionName, preserveLinkText[, arguments]) { link text }`

### Set

Set a variable. Variables in Woven are global by default meaning they are persistent throughout the story until the user
refreshes the page. Variables are interpreted by the page Javascript so text must be enclosed in quotes like so `text`.

`\set(variableName = value)`

### Example

```
\set(name = 'Joey')
\set(count = 0)
\set(count = count + 1)
```

### Print

Output the contents of a variable

`\print(variable)`

### Include

Adds the content of a section into another.

`\include(sectionName[, arguments])`

### Image

Display an image

`\image(url, height, width)`

The url can be a relative or absolute URL. Height and width can be specified as `px` I.E., `200px` or other CSS units. 
`auto` may also be used I.E., `\image(example.org/image, 200px, auto)`

### If

Display a block of text under a certain condition. Conditions are evaluated as Javascript, so
the `==` operator is used to check if values are equal. Text must be enclosed in single quotes.
You can set variables within if statements.

`\if(condition) { text }`

#### Example

```
\set(doorUnlocked = true)

\if(doorUnlocked == true) { The door creeks open! \set(doorOpened = true) }
```

### Else

Display a block if a condition is not true. An else macro must follow a corresponding `\if` macro.

`\else { text }`

### Choices

This macro is not implemented yet.

## Example story

```
\title(Example Story)

\section(main) {
\h1 { Welcome to Woven! }

Woven is a \show(coolSection, false) { cool } interactive fiction engine.

\nav(nextPage) { Turn the page }
}

\section(coolSection) {
cool, soft and rad
}

\section(nextPage) {
\h2 { Welcome to the second page }

Things feel a little different here
}
```

## TODO

* input modal function (again this is tricky because we need to have the input take
  before the template function executes.
* Choices processing
* Handle ) in strings
* Style tag
* Script tag
