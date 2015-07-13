var Less = require("less");

module.exports = {
  matches: /\.css$/,
  provides: ".less",
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