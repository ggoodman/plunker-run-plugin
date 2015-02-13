var Coffee = require("coffee-script");

var compileOptions = {
  
};

module.exports = {
  testFilename: /\.js$/,
  targetExtension: ".coffee",
  transform: function (request, reply) {
    try {
      var response = Coffee.compile(request, compileOptions);
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