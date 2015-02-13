var Sass = require("node-sass");

module.exports = {
  testFilename: /\.css$/,
  targetExtension: ".scss",
  transform: function (request, reply) {
    Sass.render({
      data: request,
      success: function (result) {
        reply(null, result.css);
      },
      error: function (err) {
        reply(err);
      },
      indentedSyntax: false,
    });
  }
};