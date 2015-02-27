var Promise = require("bluebird");
var _ = require("lodash");


exports.register = function (server, options, next) {
  Promise.promisifyAll(server);
  
  var cachePolicy = {
    expiresIn: 1000 * 60,
  };
  
  server.bind({config: options.config, server: server});
  
  server.method("previews.fetchLegacyPlunk", require("./methods/fetchLegacyPlunk"), { cache: cachePolicy });
  server.method("previews.fetchProject", require("./methods/fetchProject"), { cache: cachePolicy });
  
  server.route({ method: "GET", path: "/plunks/{plunkId}/{path*}", config: require("./routes/handleLegacyPlunk") });
  server.route({ method: "GET", path: "/project/{plunkId}/{path*}", config: require("./routes/handleProject") });
  server.route({ method: "POST", path: "/{previewId}/{path*}", config: require("./routes/handleCreatePreview") });
  server.route({ method: "GET", path: "/{previewId}/{path*}", config: require("./routes/handleServePreview") });
  
  next();
};


exports.register.attributes = {
  "name": "plunker-api-plugin-trees",
  "version": "0.0.1",
};

