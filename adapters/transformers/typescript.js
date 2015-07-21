var Boom = require('boom');
var Typescript = require('typescript');
var _ = require('lodash');

var defaultCompileOptions = _.extend(Typescript.getDefaultCompilerOptions(), {
  
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
        
        _.extend(options, tsconfig);
      } catch (__) {}
    }
    
    options.out = context.requestPath;
    
    var compilerHost = Typescript.createCompilerHost({
      getSourceFile: function (filename) {
        return Typescript.createSourceFile(filename, context.preview.files[filename], options.target);
      },
      writeFile: function (filename, text) {
        context.preview.files[filename] = text;
      },
      getDefaultLibFileName: _.constant('lib.d.ts'),
      useCaseSensitiveFileNames: _.constant(false),
      getCanonicalFileName: _.identity,
      getCurrentDirectory: _.constant(''),
      getNewLine: _.constant('\n'),
    });
    
    var program = Typescript.createProgram([context.sourcePath], options, compilerHost);
    var result = program.emit();
    var diagnostics = Typescript.getPreEmitDiagnostics(program)
      .concat(result.diagnostics);
      
    if (diagnostics.length) {
      var lastError = 'Compilation error';
      
      diagnostics.forEach(function (diagnostic) {
        var coords = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        
        lastError = Typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        
        context.preview.log({
          source: 'typescript',
          filename: diagnostics.file.fileName,
          line: coords.line,
          position: coords.character,
          data: lastError,
        });
      });
      
      throw Boom.badRequest('Compilation failed: ' + lastError, lastError);
    }

    return context.preview.files[context.requestPath];
  }
};
