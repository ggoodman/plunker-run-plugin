var Fs = require("fs");
var Path = require("path");
var Typescript = require("typescript");

var libSource = Fs.readFileSync(Path.join(Path.dirname(require.resolve('typescript')), 'lib.d.ts')).toString();
var compilerOptions = {
};

var result = transform(source, libSource);

module.exports = {
  testFilename: /\.js$/,
  targetExtension: ".es6.js",
  transform: function (request, reply) {
    var outputs = [];
    
    var compilerHost = {
      getSourceFile: function (filename, languageVersion) {
        if (filename === "file.ts")
            return Typescript.createSourceFile(filename, request, compilerOptions.target, "0");
        if (filename === "lib.d.ts")
            return Typescript.createSourceFile(filename, libSource, compilerOptions.target, "0");
        return undefined;
      },
      writeFile: function (name, text, writeByteOrderMark) {
          outputs.push({ name: name, text: text, writeByteOrderMark: writeByteOrderMark });
      },
      getDefaultLibFilename: function () { return "lib.d.ts"; },
      useCaseSensitiveFileNames: function () { return false; },
      getCanonicalFileName: function (filename) { return filename; },
      getCurrentDirectory: function () { return ""; },
      getNewLine: function () { return "\n"; }
    };
    
    try {
     // Create a program from inputs
      var program = Typescript.createProgram(["file.ts"], compilerOptions, compilerHost);
      // Query for early errors
      var errors = program.getDiagnostics();
      // Do not generate code in the presence of early errors
      if (!errors.length) {
          // Type check and get semantic errors
          var checker = program.getTypeChecker(true);
          errors = checker.getDiagnostics();
          // Generate output
          checker.emitFiles();
      }
      
      if (!outputs.length && errors.length) throw new Error("Typescript error", errors);
      
      // return {
      //     outputs: outputs,
      //     errors: errors.map(function (e) { return e.file.filename + "(" + e.file.getLineAndCharacterFromPosition(e.start).line + "): " + e.messageText; })
      // };
    } catch (err) {
      
      return process.nextTick(function () {
        reply(err);
      });
    }
    
    return process.nextTick(function () {
      reply(null, outputs.join("\n"));
    });
  }
};