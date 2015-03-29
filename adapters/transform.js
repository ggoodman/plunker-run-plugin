var Promise = require("bluebird");
var _ = require("lodash");


var internals = {};

internals.indices = [
  "index.html",
  "default.html",
  "example.html",
  "readme.html",
];

internals.transformers = [
  require("./transformers/noop"),
  
  require("./transformers/6to5"),
  require("./transformers/es6"),
  require("./transformers/coffee"),
  require("./transformers/hs"),
  require("./transformers/jade"),
  require("./transformers/jsx"),
  require("./transformers/less"),
  require("./transformers/ls"),
  require("./transformers/md"),
  require("./transformers/sass"),
  require("./transformers/scss"),
  require("./transformers/styl"),
];


exports.init = function (server, options) {
  
  
  exports.getPathCandidates = function (paths) {
    if (!_.isArray(paths)) paths = [paths];
    
    paths = _(paths).filter(Boolean).unique().value();
    
    if (!paths.length) paths = _.clone(internals.indices);

    var reducer = function (paths, path) {
      return _.union(paths, _.map(internals.transformers, function (transformer) {
        if (transformer.testFilename.test(path)) {
          
          var responsePath = path.replace(transformer.testFilename, transformer.targetExtension);
          
          return {
            transformer: transformer,
            requestPath: path,
            responsePath: responsePath,
          };
        }
      }));
    };
    
    var candidates = _.reduce(paths, reducer, []);
    
    return _(candidates)
      .filter(Boolean)
      .unique()
      .value();
  };
};
