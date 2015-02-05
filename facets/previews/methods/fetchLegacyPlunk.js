var Lookup = require("object-path");
var Promise = require("bluebird");
var Wreck = require("wreck");
var _ = require("lodash");

module.exports = function (plunkId, next) {
  var options = {
    timeout: 3000,
    json: true,
  };
  var legacyApiUrl = Lookup.get(this.server.config, "run.plunks_api_url", "http://api.plnkr.co/plunks/");
  
  return new Promise(function (resolve, reject) {
    Wreck.get(legacyApiUrl + plunkId, options, function (err, resp, payload) {
      if (err) return reject(err);
      
      resolve(payload);
    });
  })
    .then(function (plunk) {
      return _.map(plunk.files, function (entry) {
        return {
          path: (entry.filename || "").toLowerCase(),
          content: new Buffer(entry.content, "utf8"),
        };
      });
    })
    .nodeify(next);

};