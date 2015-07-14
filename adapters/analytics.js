var Analytics = require('universal-analytics');
var Bluebird = require('bluebird');
var Lookup = require('object-path');
var _ = require('lodash');

exports.register = function (server, options, next) {
  Bluebird.promisifyAll(server);
  
  server.log(['info', 'startup'], 'Initializing analytics');
  
  var uid = Lookup.get(options.config, 'analytics.id');
  
  if (!uid) throw new Error('Missing configuration `analytics.id`');
  
  server.ext('onPreHandler', function (request, reply) {
    var args = [uid];
    
    if (request.payload && request.payload.sessid) {
      args.push(request.payload.sessid);
      args.push({strictCidFormat: false});
    }
    
    request.visitor = Analytics.apply(Analytics, args);
    
    reply.continue();
  });
  
  server.ext('onPostHandler', function (request, reply) {
    request.visitor.send();
    
    reply.continue();
  });
  
  next();
};

exports.register.attributes = {
  'name': 'analytics',
  'version': '1.0.0',
};