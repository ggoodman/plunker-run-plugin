var Fs = require("fs");
var Traceur = require("traceur");

var compileOptions = {
    annotations: true,
    memberVariables: true,
    modules: "instantiate",
    typeAssertions: false,
    // typeAssertionModule: 'rtts_assert/rtts_assert',
    types: true
};

var compiler = new Traceur.NodeCompiler(compileOptions);
var runtime = Fs.readFileSync(Traceur.RUNTIME_PATH, "utf8");

module.exports = {
  testFilename: /\.js$/,
  targetExtension: ".es6.js",
  transform: function (request, reply) {
    try {
      var result = compiler.compile(request.content, request.path.replace(/\.es6\.js$/, ""));
      var response = {
        content: /*runtime + "\n\n" + */result,
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