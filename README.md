# Library Engine

A twine like interactive fiction engine, written for my game(?) The Library

## Installing

Clone the repo and run `yarn install`

## Usage

## Syntax

## TODO

* refactor with typescript
* if/else processing
* set tag handle if/else
   * really this is just walking up the tree looking for ifs or elses before you
   hit a section and wrapping the set statement in the conditions
* process the p tag handling in process section
* include tag (this is somewhat difficult since we need to execute the template
  when the containing template is loaded.
* update the template.html to execute the section functions in the navigate/show
  function and not in the arguments section (we'll need some kind of varargs thing
* input modal function (again this is tricky because we need to have the input take
  before the template function executes.
