var Traceur = require("traceur");

var compileOptions = {
    annotations: true,
    memberVariables: true,
    modules: "inline",
    typeAssertions: false,
    // typeAssertionModule: 'rtts_assert/rtts_assert',
    types: true
};

var compiler = new Traceur.NodeCompiler(compileOptions);

module.exports = {
  testFilename: /\.js$/,
  targetExtension: ".es6.js",
  transform: function (request, reply) {
    try {
      var result = compiler.compile(request.content);
      var response = {
        content: result,
        encoding: "utf8",
      };
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