var Boom = require('boom');
var Compiler = require('babel');
var _ = require('lodash');

var defaultCompileOptions = {
  stage: 0,
};


module.exports = {
  matches: /\.(6to5|babel)\.js$/,
  provides: ".js",
  transform: function (context) {
    var options = _.defaults({}, context.compileOptions, defaultCompileOptions);
    
    try {
      var result = Compiler.transform(context.sourceContent, options);
      
      return result.code;
    } catch (err) {
      context.preview.logs.push({
        source: 'babel',
        data: err,
      });
      
      throw Boom.badRequest('Compilation failed: ' + err.message, err);
    }
  }
};
