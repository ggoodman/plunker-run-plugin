var Sass = require("node-sass");

module.exports = {
  testFilename: /\.css$/,
  targetExtension: ".sass",
  transform: function (request, reply) {
    Sass.render({
      data: request,
      success: function (result) {
        reply(null, result.css);
      },
      error: reply,
      indentedSyntax: true,
    });
  }
};