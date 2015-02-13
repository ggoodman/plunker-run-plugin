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
  
  var cacheOptions = {
    privacy: "public",
    expiresIn: 1000 * 60 * 60 * 24,
  };
  
  
  server.route({ method: "GET", path: "/favicon.ico", config: { cache: cacheOptions, handler: { file: __dirname + "/static/favicon.ico" } } });
  server.route({ method: "GET", path: "/robots.txt", config: { cache: cacheOptions, handler: { file: __dirname + "/static/robots.txt" } } });
  
  
  loadAdaptors()
    .then(loadPlugins)
    .nodeify(next);
  
};

exports.register.attributes = {
  pkg: require('./package.json')
};