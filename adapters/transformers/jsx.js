var React = require("react-tools");

var compileOptions = {
  harmony: true,
};

module.exports = {
  testFilename: /\.js$/,
  targetExtension: ".jsx",
  transform: function (request, reply) {
    try {
      var response = React.transform(request, compileOptions);
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