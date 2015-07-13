var React = require("react-tools");

var compileOptions = {
  harmony: true,
};

module.exports = {
  matches: /\.js$/,
  provides: ".jsx",
  transform: function (request, reply) {
    try {
      var result = React.transform(request.content, compileOptions);
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