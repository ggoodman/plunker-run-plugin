var Compiler = require("babel");

var compileOptions = {
  experimental: true,
};

module.exports = {
  testFilename: /\.js$/,
  targetExtension: ".6to5.js",
  transform: function (request, reply) {
    try {
      var response = Compiler.transform(request, compileOptions);
    } catch (err) {
      
      return process.nextTick(function () {
        reply(err);
      });
    }
    
    return process.nextTick(function () {
      reply(null, response.code);
    });
  }
};