var Bluebird = require('bluebird');
var Less = require('less');

module.exports = {
  matches: /\.less$/,
  provides: '.css',
  transform: function (context) {
    var render = Bluebird.promisify(Less.render, Less);
    
    return render(context.sourceContent)
      .get('css');
  }
};