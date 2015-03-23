var Cuid = require("cuid");
var Boom = require("boom");
var LRU = require("lru-cache");
var Mime = require("mime-types");
var Primus = require("primus");
var Promise = require("bluebird");
var Transform = require("./transform");
var Sha = require("git-sha1");
var _ = require("lodash");

var internals = {};

exports.init = function (server, options) {
  var frontEndPath = __dirname + "/../static/streamer.js";
  var primus = new Primus(server.listener, {
    transformer: "sockjs",
    requestTimeout: 30000,
  });
  
  // primus.use("mirage", require("mirage"));
  primus.use("substream", require("substream"));
  primus.use("callbacks", require("primus-callbacks"));
  
  primus.save(frontEndPath, function (err) {
    if (err) {
      throw err;
    }
    
    server.route({ method: "GET", path: "/static/streamer.js", handler: { file: frontEndPath } });
  });
  
  
  primus.on("connection", function (spark) {
    // console.log("Spark", spark.id);
  });
  
  var handleStream = {
    handler: function (request, reply) {
      var spark = primus.spark(request.params.sparkId);
      var path = request.params.path;
      
      if (!spark) return reply(Boom.notFound());
      
      var candidates = _.indexBy(Transform.getPathCandidates(path), "responsePath");
      var clientRequest = {
        action: "request",
        candidates: _.keys(candidates),
      };
      
      var logSpeed = function (promise, message) {
        var start = Date.now();
        
        promise
          .finally(function () {
            var end = Date.now();
            
            request.log("log", message + " (" + (end - start) + "ms)");
          });
        
        return promise;
      };

      Promise.promisifyAll(spark);
      
      logSpeed(spark.writeAndWaitAsync(clientRequest), "Requesting " + path)
        .then(function (clientResponse) {
          if (!clientResponse) throw new Boom.notFound();
          
          if (clientResponse.type === "buffer") {
            if (!clientResponse.path) throw new Boom.notFound();
            
            var candidate = candidates[clientResponse.path];
            var transform = Promise.promisify(candidate.transformer.transform);
            
            if (!candidate) throw new Boom.notFound();
            
            return transform(clientResponse)
              .then(function (transformedResponse) {
                var mime = Mime.lookup(candidate.requestPath) || "text/plain";
                var content = new Buffer(transformedResponse.content, transformedResponse.encoding);
                
                reply(content)
                  // .header("cache-control", "private, must-revalidate")
                  .header("last-modified", clientResponse.lastModified)
                  .type(mime);
                
              });
          } else  {
            throw Boom.notFound();
          }
        }, function (err) {
          request.log("error", err.message);
          
          reply(Boom.notFound());
        });
    }
  };
  
  server.route({ method: "GET", path: "/streaming/{sparkId}/{path*}", config: handleStream });
  
};

