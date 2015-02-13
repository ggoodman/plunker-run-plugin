var Boom = require("boom");
var LRU = require("lru-cache");
var Promise = require("bluebird");
var _ = require("lodash");


exports.init = function (server, options) {
  var cache = new LRU({
    max: 1024 * 100,
    maxAge: 1000 * 60 * 30, // 30min
    length: function (item) {
      if (item instanceof Buffer) return item.length;
      
      return JSON.stringify(item).length;
    }
  });
  
  exports.del = function (key) {
    cache.del(key);
    
    return Promise.resolve();
  };
  
  exports.get = function (key) {
    var value = cache.get(key);
    
    if (value) return Promise.resolve(value);
    else return Promise.reject(Boom.notFound());
  };
  
  exports.set = function (key, value) {
    cache.set(key, value);
    
    return Promise.resolve(value);
  };
};