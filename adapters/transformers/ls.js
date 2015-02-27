var LiveScript = require("LiveScript");

var compileOptions = {
  
};

module.exports = {
  testFilename: /\.js$/,
  targetExtension: ".ls",
  transform: function (request, reply) {
    try {
      var result = LiveScript.compile(request.content, compileOptions);
      var response = {
        content: result.code,
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