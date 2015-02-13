var Less = require("less");

module.exports = {
  testFilename: /\.css$/,
  targetExtension: ".less",
  transform: function (request, reply) {
    Less.render(request, function (e, output) {
      if (e) return reply(e);
      
      reply(null, output.css);
    });
  }
};