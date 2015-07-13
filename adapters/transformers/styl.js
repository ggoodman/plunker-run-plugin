var Bluebird = require('bluebird');
var Stylus = require('stylus');

module.exports = {
  matches: /\.styl$/,
  provides: '.css',
  transform: function (context) {
    var render = Bluebird.promisify(Stylus.render, Stylus);
    
    return render(context.sourceContent);
  }
};