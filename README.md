# Compilation in Plunker

Plunker is designed to make it as easy as possible for you to
work in compiled web languages.

There are two ways that Plunker will trigger compilation:
1. The `implicit` mode
2. The `explicit` mode

Additionally, you can configure some of the compilers with
configuration files as described below.

**This system is [Open Source](https://github.com/ggoodman/plunker-run-plugin)**

## The implicit mode

The implicit mode works in a way that is totally transparent
to the user. You create a file in the source language of your
choice (with the corresponding  **source** extension). Then, when you
want to _use_ this file, you request that file with the
**target** extension.

For example, this Plunk demonstrates two examples of implicit
compilation.

1. There is a file `style.less`, written in less, that is
   being requested by a `<link rel="stylesheet" href="style.css">`
   tag in `index.html`.
2. There is a file `README.md`, written in markdown, that is
   being included in the `index.html` via an `ng-include`
   directive. That directive requests `README.html`, not
   `README.md`.

Notice how in both instances, the file requested differs
from the file in the Plunk only by its extension.

#### Supported mappings

| Library       | Source                          | Target  |
| --------      | ------------------------------  | ------- |
| Babel         | `.jsx`, `.6to5.js`, `.babel.js` | `.js`   |
| Typescript    | `.ts`                           | `.js`   |
| Traceur       | `.es6.js`, `.traceur.js`        | `.js`   |
| Less          | `.less`                         | `.css`  |
| Sass          | `.sass`, `.scss`                | `.css`  |
| Markdown      | `.md`, `.markdown`              | `.html` |
| Coffee-Script | `.coffee`                       | `.js`   |  
| Jade          | `.jade`                         | `.css`  |
| Stylus        | `.styl`                         | `.css`  |

**Note: Config files (see below) are supported in the
implicit AND explicit modes**

## The explicit mode

The explicit mode is currently only supported for javascript
(`.js`) files. To trigger a `.js` file to be passed through
one of the supported compilers, you need to use the
appropriate `directive`.

An example of using the `babel` directive is:

```js
"use babel";

document.onload = (e) => {
  alert('I just annoyed whoever visited this page! USING ES6!');
};
```

The syntax for using a compilation directive is
`"use <compiler>[(config: param, param2: value)]"`. In other words, you
need to indicate the compiler you'd like to use and you can
optionally pass in compiler options inline as a list of
key-value pairs inside parentheses.

#### Supported explicit compilers (and config files)

| Library | Directive | Config file |
| ------- | --------- | ----------- |
| Babel | `"use babel";` | `.babelrc` |
| Typescript | `"use typescript";` | `tsconfig.json` |
| Traceur | `"use traceur";` | `.traceurrc` |



**Note: These files must be valid JSON**

I'm open to adding more support for other configuration files
if you create an issue on
[Github](https://github.com/ggoodman/plunker-run-plugin/issues)
indicating which language, the idiomatic config file and
a link to an example of how that config file is used by the
compiler.
