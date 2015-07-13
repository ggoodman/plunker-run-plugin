var Jade = require("jade");

var compileOptions = {
  pretty: true,
};

module.exports = {
  matches: /\.html?$/,
  provides: ".jade",
  transform: function (request, reply) {
    try {
      var result = Jade.render(request.content, compileOptions);
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