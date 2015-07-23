var Bluebird = require('bluebird');
var Sass = require('node-sass');

module.exports = {
  matches: /\.s(a|c)ss$/,
  provides: '.css',
  transform: function (context) {
    var sassRx = /\.sass$/;
    var indentedSyntax = sassRx.test(context.requestPath);
    return new Bluebird(function (resolve, reject) {
      Sass.render({
        data: context.sourceContent,
        success: function (result) {
          resolve(result.css);
        },
        error: reject,
        indentedSyntax: indentedSyntax,
      });
    });
  }
};