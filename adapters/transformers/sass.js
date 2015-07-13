var Sass = require("node-sass");

module.exports = {
  matches: /\.css$/,
  provides: ".sass",
  transform: function (request, reply) {
    Sass.render({
      data: request.content,
      success: function (result) {
        reply(null, {
          content: result.css,
          encoding: "utf8"
        });
      },
      error: reply,
      indentedSyntax: true,
    });
  }
};