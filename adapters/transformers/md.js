var Highlight = require('highlight.js');
var Markdown = require('markdown-it');

var md = Markdown({
  highlight: function (str, lang) {
    if (lang && Highlight.getLanguage(lang)) {
      try {
        return Highlight.highlight(lang, str).value;
      } catch (__) {}
    }

    try {
      return Highlight.highlightAuto(str).value;
    } catch (__) {}

    return ''; // use external default escaping
  }
});

module.exports = {
  matches: /\.md$/,
  provides: '.html',
  transform: function (context) {
    return md.render(context.sourceContent);
  }
};