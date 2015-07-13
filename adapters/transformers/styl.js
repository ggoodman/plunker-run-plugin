var Stylus = require("stylus");

module.exports = {
  matches: /\.css$/,
  provides: ".styl",
  transform: function (request, reply) {
    Stylus.render(request.content, function (err, css) {
      if (err) return reply(err);
      
      reply(null, {
        content: css,
        encoding: "utf8",
      });
    });
  }
};