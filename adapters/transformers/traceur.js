var Fs = require('fs');
var Traceur = require('traceur');
var _ = require('lodash');

var defaultCompileOptions = {
    annotations: true,
    memberVariables: true,
    modules: 'instantiate',
    typeAssertions: false,
    // typeAssertionModule: 'rtts_assert/rtts_assert',
    types: true
};

var runtime = Fs.readFileSync(Traceur.RUNTIME_PATH, 'utf8');

module.exports = {
  matches: /\.(es6|traceur)\.js$/,
  provides: '.js',
  transform: function (context) {
    var options = _.defaults({}, context.compileOptions, defaultCompileOptions);
    var compiler = new Traceur.NodeCompiler(options);
    var compiled = compiler.compile(context.requestContent, context.requestPath.replace(/\.es6\.js$/, ''));
    
    if (context.compileOptions.runtime) compiled = runtime + '\n\n' + compiled;
    
    return compiled;
  }
};