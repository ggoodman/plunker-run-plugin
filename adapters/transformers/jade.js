var Jade = require('jade');

var compileOptions = {
  pretty: true,
};

module.exports = {
  matches: /\.jade$/,
  provides: '.html',
  transform: function (context) {
    return Jade.render(context.sourceContent, compileOptions);
  }
};