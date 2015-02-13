var Highlight = require('highlight.js');
var Markdown = require("markdown-it");

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
  testFilename: /\.html?$/,
  targetExtension: ".md",
  transform: function (request, reply) {
    try {
      var html = md.render(request);
    } catch (err) {
      
      return process.nextTick(function () {
        reply(err);
      });
    }
    
    return process.nextTick(function () {
      reply(null, html);
    });
  }
};