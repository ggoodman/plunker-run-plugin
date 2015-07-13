var Coffee = require("coffee-script");

var compileOptions = {
  
};

module.exports = {
  matches: /\.js$/,
  provides: ".coffee",
  transform: function (request, reply) {
    try {
      var result = Coffee.compile(request.content, compileOptions);
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