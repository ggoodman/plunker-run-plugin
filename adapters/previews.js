var Boom = require("boom");
var Cache = require("./cache");
var Crypto = require("crypto");
var Mime = require("mime-types");
var Promise = require("bluebird");
var Transform = require("./transform");
var _ = require("lodash");


exports.init = function (server, options) {
  
  
  function Preview (key, entries) {
    this.key = key;
    this.entries = entries;
  }
  
  Preview.prototype.findMatchingEntry = function (candidates) {
    var found;
    
    _.forEach(candidates, function (candidate) {
      var entry = this.entries[candidate.responsePath];
      
      if (entry) {
        found = candidate;
        found.entry = entry;
      }
      
      return !found;
    }, this);
    
    return found;
  };
  
  Preview.prototype.render = function (path, options) {
    var self = this;
    
    if (!options) options = {};
    else if (_.isFunction(options)) options = {getter: options};
    
    if (!_.isFunction(options.getter)) options.getter = Cache.get.bind(Cache);
    
    return new Promise(function (resolve, reject) {
      var candidates = Transform.getPathCandidates([path]);
      var found = self.findMatchingEntry(candidates);
            
      if (!found) return reject(Boom.notFound());
      
      var transform = Promise.promisify(found.transformer.transform);
      var complete = function (content) {
        return resolve({
          content: content,
          type: Mime.lookup(found.requestPath) || "text/plain",
        });
      };
      
      return Promise.resolve(options.getter(found.entry))
        .call("toString", "utf8")
        .then(transform)
        .then(complete);
    });
  };
  
  
  exports.create = function (key, entries) {
    return Promise.map(entries, function (entry) {
      var shasum = Crypto.createHash('sha1');
      
      shasum.update(entry.content);
      
      entry.key = ["files", shasum.digest("hex")].join(".");
      
      return Cache.set(entry.key, entry.content)
        .return(entry);
    })
      .then(function (entries) {
        var files = _(entries)
          .indexBy("path")
          .mapValues("key")
          .value();
          
        return Cache.set(key, files);
      })
      .then(function (entries) {
        return new Preview(key, entries);
      });
  };
  
  exports.open = function (key) {
    return Cache.get(key)
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
