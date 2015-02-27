var Less = require("less");

module.exports = {
  testFilename: /\.css$/,
  targetExtension: ".less",
  transform: function (request, reply) {
    Less.render(request.content, function (e, output) {
      if (e) return reply(e);
      
      reply(null, {
        content: output.css,
        encoding: "utf8",
      });
    });
  }
};