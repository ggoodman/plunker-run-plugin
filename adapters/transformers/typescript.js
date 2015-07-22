var Boom = require('boom');
var Typescript = require('typescript');
var _ = require('lodash');

var defaultCompileOptions = _.extend(Typescript.getDefaultCompilerOptions(), {
  allowNonTsExtensions: true,
  isolatedModules: true,
  module: Typescript.ModuleKind.UMD,
  noLib: true,
  noResolve: false,
  target: Typescript.ScriptTarget.ES3,
});


module.exports = {
  matches: /\.ts$/,
  provides: ".js",
  transform: function (context) {
    var options = _.defaults({}, context.compileOptions, defaultCompileOptions);
    
    var tsconfig = context.preview.files['tsconfig.json'];
    
    if (typeof tsconfig !== 'undefined') {
      try {
        tsconfig = JSON.parse(tsconfig);
        
        _.extend(options, tsconfig.compilerOptions);
      } catch (__) {}
    }
    
    context.preview.files[context.requestPath] = '';
    
    var compilerHost = {
      getSourceFile: function (filename) {
        return Typescript.createSourceFile(filename, context.preview.files[filename], options.target);
      },
      writeFile: function (filename, text) {
        context.preview.files[context.requestPath] += text;
      },
      getDefaultLibFileName: _.constant('lib.d.ts'),
      useCaseSensitiveFileNames: _.constant(false),
      getCanonicalFileName: _.identity,
      getCurrentDirectory: _.constant(''),
      getNewLine: _.constant('\n'),
    };
    
    var program = Typescript.createProgram([context.sourcePath], options, compilerHost);
    var result = program.emit();
    var diagnostics = Typescript.getPreEmitDiagnostics(program)
      .concat(result.diagnostics);
      
    if (diagnostics.length) {
      var lastError = 'Compilation error';
      
      diagnostics.forEach(function (diagnostic) {
        lastError = Typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        
        var msg = {
          source: 'typescript',
          data: lastError,
        };
        
        if (diagnostic.file) {
          var coords = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
          
          msg.filename = diagnostic.file.fileName;
          msg.line = coords.line;
          msg.position = coords.character;
        }
        
        context.preview.log(msg);
      });
    }
    
    if (!context.preview.files[context.requestPath]) {
      throw new Boom.badRequest('Compilation failed: ' + lastError, lastError);
    }

    return context.preview.files[context.requestPath];
  }
};
