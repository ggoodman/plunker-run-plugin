var Html2Hscript = require("html2hscript");

module.exports = {
  testFilename: /\.js?$/,
  targetExtension: ".hs.html",
  transform: function (request, reply) {
    Html2Hscript(request.content, function (err, result) {
      if (err) return reply(err);
      
      return reply(null, {
        content: result,
        encoding: "utf8",
      });
      
    });
  }
};