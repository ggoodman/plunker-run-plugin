var Coffee = require('coffee-script');

var compileOptions = {
  
};

module.exports = {
  matches: /\.coffee$/,
  provides: '.js',
  transform: function (context) {
    return Coffee.compile(context.sourceContent, compileOptions);
  }
};