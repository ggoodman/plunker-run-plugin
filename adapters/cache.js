var Bluebird = require('bluebird');
var _ = require('lodash');

exports.register = function (server, options, next) {
  Bluebird.promisifyAll(server);
  
  server.log(['info', 'startup'], 'Initializing cache');
  
  var ttl = 1000 * 60 * 5;
  var cache = server.cache({
    expiresIn: ttl,
    segment: 'previews',
  });
  
  server.expose('cache', cache);
  server.expose('ttl', ttl);
  
  server.method('cache.get', cache.get.bind(cache));
  server.method('cache.set', cache.set.bind(cache));
  
  next();
};

exports.register.attributes = {
  'name': 'cache',
  'version': '1.0.0',
};