# Woven Story Engine

## WARNING: this is alpha quality software. Use at your own peril!

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

Showing a section adds it to the currently visible text. There are two show macros. `\show-reveal` which appends
the linked section below the link text, and `\show-replace` which replaces the link text with the section.

`\show-reveal(sectionName[, arguments]) { link text }`

`\show-replace(sectionName[, arguments]) { link text }`

### Set

Set a variable. Variables in Woven are global by default meaning they are persistent throughout the story until the user
refreshes the page. Variables are interpreted by the page Javascript so text must be enclosed in quotes like so `text`. 
When a set macro is used within a `\section` block, it will execute when that section is visited. If `\set` is called 
outside of a section it will be called when the story is loaded.

Note: Inside sections you can place `\set` statements within `\if` or `\else` blocks. The variable will only be set if 
the conditions of the if or else are met.

`\set(variableName = value)`

#### Example

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

`\image(url, height, width, alt)`

The url can be a relative or absolute URL. Height and width can be specified as `px` I.E., `200px` or other CSS units. 
`auto` may also be used I.E., `\image(example.org/image, 200px, auto, alt text)`

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

The choices macro allows you to provide the user with a set of choices, only one of which may be selected.

`\choices { \choice-reveal(section[, arguments) { Choice text } }`

A choices block may contain any number `\choice-reveal` and `\choice-replace` macros. These macros are nearly identical 
to`\show-reveal` and `\show-replace`. The only difference is that when a choice is clicked the other choices disappear.

#### Example

```
\section(main) {
\choices {
\choice-reveal(win) { Pick heads }
\choice-replace(lose) { Pick tails }
}}

\section(win) { You win! }
\section(lose) { You lose! }
```

### Input

The `\input` macro takes input from the player and assigns it to a variable.

`\input(type, variable[, placeholder])`

The input type parameter determines the input type. This can be any HTML5 input type; however, for most uses
`text` or `number` will probably be what you want to use. `variable` determines the name of the variable the
output will be set to, and optionally placeholder determines text that will be shown as a placeholder when the 
input box is empty.

Note: variable updates do not take effect on sections that are already visible. They only effect new sections 
as they are displayed.

#### Example

```
\section(main) {
\input(text, textVariable, enter some text)

\nav(sectionTwo) { onwards }
}

\section(sectionTwo) { \print(testVariable) }
```

In this example, the text the user entered into the input box will be displayed when the click *onwards* and sectionTwo 
is displayed.

### Style

You can add custom styling to your stories with `\style`.

`\style { CSS code }`

When used within a section, `\style` will only change the CSS for as long as that section is visible. When used outside 
a section, the CSS will be persistent throughout the story.

#### Example

```
\style {
h1 { color: blue; }
}
```

This example will turn header text blue.

### Script

With `\script` you can add custom JavaScript code to your stories. When used within a section, the code will run when the 
section becomes visible. Using `\script` outside of a section block will cause the code to be run when the game is loaded.

`\script { JS code }`

#### Example

```
\script {
console.log('hello world!')
}
```

This example will cause *hell world* to be printed to the JavaScript console.

## Example story

```
\title(Example Story)

\section(main) {
\h1 { Welcome to Woven! }

Woven is a \show-replace(coolSection) { cool } interactive fiction engine.

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
