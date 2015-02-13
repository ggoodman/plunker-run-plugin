var Jade = require("jade");

var renderOptions = {
  pretty: true,
};

module.exports = {
  testFilename: /\.html?$/,
  targetExtension: ".jade",
  transform: function (request, reply) {
    try {
      var html = Jade.render(request, renderOptions);
    } catch (err) {
      
      return process.nextTick(function () {
        reply(err);
      });
    }
    
    return process.nextTick(function () {
      reply(null, html);
    });
  }
};