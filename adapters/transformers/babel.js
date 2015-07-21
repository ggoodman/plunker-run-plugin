var Boom = require('boom');
var Compiler = require('babel');
var _ = require('lodash');

var defaultCompileOptions = {
  stage: 2,
};


module.exports = {
  matches: /(\.(6to5|babel)\.js|\.jsx)$/,
  provides: ".js",
  transform: function (context) {
    var options = _.defaults({}, context.compileOptions, defaultCompileOptions);
    
    var babelrc = context.preview.files['.babelrc'];
    
    if (typeof babelrc !== 'undefined') {
      try {
        babelrc = JSON.parse(babelrc);
        
        _.extend(options, babelrc);
      } catch (__) {}
    }
    
    try {
      var result = Compiler.transform(context.sourceContent, options);
      
      return result.code;
    } catch (err) {
      context.preview.log({
        source: 'babel',
        data: err,
      });
      
      throw Boom.badRequest('Compilation failed: ' + err.message, err);
    }
  }
};
