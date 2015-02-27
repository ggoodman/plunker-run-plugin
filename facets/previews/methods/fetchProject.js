var Jwt = require("jsonwebtoken");
var Lookup = require("object-path");
var Promise = require("bluebird");
var Url = require("url");
var Wreck = require("wreck");
var _ = require("lodash");

module.exports = function (plunkId, next) {
  var jwt = Jwt.sign({
    v: 0,
    d: {
      session_id: "plunker-run-plugin",
      user: null,
    },
  }, Lookup.get(this.config, "auth.secret", ""));
  
  var options = {
    timeout: 3000,
    json: true,
    headers: {
      "Authorization": "Bearer " + jwt,
    }
  };
  
  var apiUrl = Lookup.get(this.config, "services.api.public", {});
  
  apiUrl = _.defaults(apiUrl, {
    protocol: "http",
    host: "localhost",
    pathname: "",
  });

  var fetch = function (path) {
    var url = _.clone(apiUrl);
    
    url.pathname += path;
    url = Url.format(url);
    
    return new Promise(function (resolve, reject) {
      Wreck.get(url, options, function (err, resp, payload) {
        if (err) return reject(err);
        
        resolve(payload);
      });
    });
  };
  
  fetch("/plunks/" + plunkId)
    .then(function (plunk) {
      return fetch("/trees/" + plunk.head.tree_sha);
    })
    .then(function (tree) {
      var entries = [];
      var traverse = function (parentPath, entry) {
        var path = parentPath.concat([entry.filename]);
        switch (entry.type) {
          case 'directory':
            return _.forEach(entry.children, _.partial(traverse, path));
          case 'file':
            entries.push({
              path: path.filter(Boolean).join("/"),
              content: entry.content,
              encoding: entry.encoding,
            });
        }
      };
      
      traverse([], tree);
      
      return entries;
    })
    .nodeify(next);

};