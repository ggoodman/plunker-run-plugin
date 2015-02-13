var Traceur = require("traceur");

var compileOptions = {
  modules: "commonjs", // Is this right?
};

var compiler = new Traceur.NodeCompiler(compileOptions);

module.exports = {
  testFilename: /\.js$/,
  targetExtension: ".es6.js",
  transform: function (request, reply) {
    try {
      var response = compiler.compile(request);
    } catch (err) {
      
      return process.nextTick(function () {
        reply(err);
      });
    }
    
    return process.nextTick(function () {
      reply(null, response);
    });
  }
};