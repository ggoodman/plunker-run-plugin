var Bluebird = require('bluebird');
var _ = require('lodash');


exports.register = function (server, options, next) {
  Bluebird.promisifyAll(server);
  
  server.bind({config: options.config, server: server});
  
  server.route({ method: 'GET', path: '/plunks/{plunkId}/{path*}', config: require('./routes/handleServePlunk') });
  server.route({ method: 'POST', path: '/{previewId}/{path*}', config: require('./routes/handleCreatePreview') });
  server.route({ method: 'GET', path: '/{previewId}/{path*}', config: require('./routes/handleServePreview') });
  server.route({ method: 'GET', path: '/logs/{previewId}', config: require('./routes/handleServeLogs') });
  
  next();
};


exports.register.attributes = {
  'name': 'facets.previews',
  'version': '0.0.1',
};

