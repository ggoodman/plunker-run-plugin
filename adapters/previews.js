var Boom = require("boom");
var Cache = require("./cache");
var Crypto = require("crypto");
var Mime = require("mime-types");
var Promise = require("bluebird");
var Transform = require("./transform");
var _ = require("lodash");


exports.init = function (server, options) {
  
  
  function Preview (entries) {
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
    
    if (!_.isFunction(options.getter)) options.getter = _.identity;
    
    return new Promise(function (resolve, reject) {
      var candidates = Transform.getPathCandidates([path.toLowerCase()]);
      var found = self.findMatchingEntry(candidates);
      
      if (!found) {
        return reject(Boom.notFound());
      }
      
      var transform = Promise.promisify(found.transformer.transform);
      var complete = function (entry) {
        return resolve({
          content: new Buffer(entry.content, entry.encoding),
          type: Mime.lookup(found.requestPath) || "text/plain",
        });
      };
      
      return Promise.resolve(options.getter(found.entry))
        .then(transform)
        .then(complete)
        .catch(reject);
    });
  };
  
  
  exports.create = function (entries) {
    return Promise.resolve(_.indexBy(entries, "path"))
      .then(function (files) {
        return new Preview(files);
      });
  };
  
  exports.open = function (key) {
    return Cache.get(key)
      .then(function (entries) {
        return new Preview(entries);
      });
  };
  
  exports.load = function (prefix, key, loader) {
    return exports.open(prefix + "." + key)
      .catch(function () {
        return loader(key)
          .spread(function (entries) {
            return exports.create(prefix + "." + key, entries);
          });
      });
  };
};
