var Sass = require("node-sass");

module.exports = {
  testFilename: /\.css$/,
  targetExtension: ".sass",
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