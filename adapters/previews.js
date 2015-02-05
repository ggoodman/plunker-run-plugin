var Boom = require("boom");
var Cache = require("lru-cache");
var Crypto = require("crypto");
var Mime = require("mime-types");
var Path = require("path");
var Promise = require("bluebird");
var _ = require("lodash");


exports.init = function (server, options) {
  var cacheInst = new Cache({
    max: 1024 * 100,
    maxAge: 1000 * 60 * 30, // 30min
    length: function (item) {
      if (item instanceof Buffer) return item.length;
      
      return JSON.stringify(item).length;
    }
  });
  
  var cache = {
    del: function (key) {
      cacheInst.del(key);
      
      return Promise.resolve();
    },
    get: function (key) {
      var value = cacheInst.get(key);
      
      if (value) return Promise.resolve(value);
      else return Promise.reject(Boom.notFound());
    },
    set: function (key, value) {
      cacheInst.set(key, value);
      
      return Promise.resolve(value);
    }
  };
  
  
  function Preview (key, entries) {
    this.key = key;
    this.entries = entries;
  }
  
  Preview.prototype.render = function (reply, path) {
    path = (path || "").toLocaleLowerCase();
    
    var key = this.entries[path];
    
    if (!key && !path) {
      var indices = ["index.html"];
      
      _.find(indices, function (index) {
        key = this.entries[index];
        path = index;
        
        // TODO compilers
        
        return !!key;
      }, this);
    }
    
    if (!key) return reply(Boom.notFound());
    
    return cache.get(key)
      .then(function (buffer) {
        var mime = Mime.lookup(path) || "text/plain";
        
        reply(buffer)
          .type(mime);
      });
  };
  
  
  exports.create = function (key, entries) {
    return Promise.map(entries, function (entry) {
      var shasum = Crypto.createHash('sha1');
      
      shasum.update(entry.content);
      
      entry.key = ["files", shasum.digest("hex")].join(".");
      
      return cache.set(entry.key, entry.content)
        .return(entry);
    })
      .then(function (entries) {
        var files = _(entries)
          .indexBy("path")
          .mapValues("key")
          .value();
          
        return cache.set(key, files);
      })
      .then(function (entries) {
        return new Preview(key, entries);
      });
  };
  
  exports.open = function (key) {
    return cache.get(key)
      .then(function (entries) {
        return new Preview(key, entries);
      });
  };
  
  exports.load = function (prefix, key, loader) {
    return exports.open(prefix + "." + key)
      .catch(function () {
        return loader(key)
          .then(function (entries) {
            return exports.create(prefix + "." + key, entries);
          });
      });
  };
};
