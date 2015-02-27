var Sass = require("node-sass");

module.exports = {
  testFilename: /\.css$/,
  targetExtension: ".scss",
  transform: function (request, reply) {
    Sass.render({
      data: request.content,
      success: function (result) {
        reply(null, {
          content: result.css,
          encoding: "utf8"
        });
      },
      error: function (err) {
        reply(err);
      },
      indentedSyntax: false,
    });
  }
};