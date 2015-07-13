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
  matches: /\.html?$/,
  provides: ".md",
  transform: function (request, reply) {
    try {
      var result = md.render(request.content);
      var response = {
        content: result,
        encoding: "utf8",
      };
    } catch (err) {
      
      return process.nextTick(function () {
        reply(err);
      });
    }
    
    return process.nextTick(function () {
      reply(null, response);
    });
  }
};