var Bluebird = require('bluebird');
var Boom = require('boom');
var Lookup = require('object-path');
var Wreck = require('wreck');
var _ = require('lodash');

Bluebird.promisifyAll(Wreck);

exports.register = function (server, options, next) {
  Bluebird.promisifyAll(server);
  
  var apiUrl = Lookup.get(options.config, 'shared.url.api');
  
  server.log(['info', 'startup'], 'Initializing plunks service');
  
  server.method('plunks.load', plunksLoad, {
    cache: {
      expiresIn: 1000 * 5,
      segment: 'plunks',
    }
  });
  
  next();
  
  
  function plunksLoad (plunkId, next) {
    var promise = new Bluebird(function (resolve, reject) {
      
      var url = apiUrl + '/plunks/' + plunkId;
      
      var options = {
        timeout: 3 * 1000,
        json: true,
      };
      
      return Wreck.get(url, options, function (err, res, body) {
        if (err) return reject(err);
        if (res.statusCode >= 300) return reject(Boom.badGateway(
          'Unexpected response from api server: ' + res.statusCode, body));
          
        resolve(body);
      });
    });
    
    return promise.nodeify(next);
  }
};

exports.register.attributes = {
  'name': 'plunks',
  'version': '1.0.0',
};