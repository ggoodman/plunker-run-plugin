var Boom = require("boom");
var Promise = require("bluebird");
var _ = require("lodash");


exports.register = function (server, options, next) {
  Promise.promisifyAll(server);
  
  server.log("info", "Registering run plugin");
  
  var loadAdaptors = function () {
    return server.registerAsync([{
      register: require("./adapters/plunks"),
      options: options,
    }, {
      register: require("./adapters/cache"),
      options: options,
    }, {
      register: require("./adapters/previews"),
      options: options,
    }, {
      register: require("./adapters/analytics"),
      options: options,
    }]);
  };

  var loadFacets = function () {
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
    .then(loadFacets)
    .nodeify(next);
  
};

exports.register.attributes = {
  pkg: require('./package.json')
};