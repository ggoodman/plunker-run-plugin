var LiveScript = require("LiveScript");

var compileOptions = {
  
};

module.exports = {
  testFilename: /\.js$/,
  targetExtension: ".ls",
  transform: function (request, reply) {
    try {
      var response = LiveScript.compile(request, compileOptions);
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