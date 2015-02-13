var Boom = require("boom");
var Promise = require("bluebird");
var _ = require("lodash");


exports.register = function (server, options, next) {
  Promise.promisifyAll(server);
  
  server.log("info", "Registering run plugin");
  
  var loadAdaptors = function () {
    return Promise.all([
      require("./adapters/cache").init(server, options),
      require("./adapters/previews").init(server, options),
      require("./adapters/streamer").init(server, options),
      require("./adapters/transform").init(server, options),
    ]);
  };

  var loadPlugins = function () {
    return server.registerAsync([{
      register: require("./facets/previews"),
      options: options,
    }]);
  };
  
  
  
  
  loadAdaptors()
    .then(loadPlugins)
    .nodeify(next);
  
};

exports.register.attributes = {
  pkg: require('./package.json')
};