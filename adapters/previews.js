var Bluebird = require('bluebird');
var Boom = require('boom');
var Mime = require('mime-types');
var Path = require('path');
var _ = require('lodash');

exports.register = function (server, options, next) {
  Bluebird.promisifyAll(server);
  
  server.log(['info', 'startup'], 'Initializing previews service');
  
  server.bind({
    config: options.config,
  });
  
  server.method('previews.fromJson', Preview.fromJson, {callback: false});
  server.method('previews.fromPlunk', Preview.fromPlunk, {callback: false});
  server.method('previews.render', Preview.render);
  
  next();
};

exports.register.attributes = {
  'name': 'previews',
  'version': '1.0.0',
};

var directives = {
  babel: require('./transformers/babel.js'),
  // traceur: require('./transformers/es6.js'),
  // typescript: require('./transformers/ts.js'),
};


var transformers = [
  directives.babel,
  require('./transformers/webtask.js'),
  // require('./transformers/coffee.js'),
  // directives.traceur,
  // require('./transformers/hs.js'),
  // require('./transformers/jade.js'),
  // require('./transformers/jsx.js'),
  // require('./transformers/less.js'),
  // require('./transformers/ls.js'),
  // require('./transformers/md.js'),
  // require('./transformers/sass.js'),
  // require('./transformers/scss.js'),
  // require('./transformers/styl.js'),
  // directives.typescript,
];

function Preview (type, id, files) {
  this.files = files;
  this.id = id;
  this.logs = [];
  this.type = type;
}

Preview.prototype.clear = function () {
  this.logs.length = 0;
};

Preview.prototype.log = function (obj) {
  this.logs.push(obj);
};

Preview.fromJson = function (id, json) {
  var files = _(json.files)
    .mapValues('content')
    .mapKeys(function (content, path) {
      return path.split('/').filter(Boolean).join('/');
    })
    .value();
  
  return new Preview('preview', id, files);
};

Preview.fromPlunk = function (id, json) {
  var files = _(json.files)
    .mapValues('content')
    .mapKeys(function (path) {
      return path.split('/').filter(Boolean).join('/');
    })
    .value();
  
  return new Preview('plunk', id, files);
};

//previewId, preview, requestPath, method, headers, query
Preview.render = function (request, reply) {
  var config = this.config;
  var preview = request.pre.preview;
  var requestPath = request.params.path;
  
  if (!preview) throw Boom.notFound('Preview has expired or project does not exist.');
  
  var candidates = requestPath.slice(-1) === '/'
    ? ['index.html', 'README.html', 'demo.html'].map(function (index) {
      return requestPath + index;
    })
    : [requestPath];
    
  Bluebird
    .map(candidates, render)
    .any()
    .then(normalize)
    .catch(Bluebird.RangeError, function (errs) {
      throw Boom.notFound();
    })
    .nodeify(reply);
  
  
  function render (path) {
    var content = preview.files[path];
    
    if (typeof content !== 'undefined') {
      if (Path.extname(path) === '.js') {
        var matches = content.match(/^\s*"use ([^"]+)";?/);
        var directive = matches && directives[matches[1]];
        
        if (directive) {
          return directive.transform({
            config: config,
            preview: preview,
            request: request,
            requestPath: path,
            sourcePath: path,
            sourceContent: content,
          });
        }
      }
      
      return content;
    }
    
    // Start a competitive race between transformers to handle the request
    return Bluebird
      .map(transformers, function (transformer) {
        for (var sourcePath in preview.files) {
          var produces = sourcePath
            .replace(transformer.matches, transformer.provides);
            
          if (produces === path) {
            var content = preview.files[sourcePath];
            
            return [transformer, sourcePath, content];
          }
        }
      })
      .filter(Boolean)
      .any()
      .spread(function (transformer, sourcePath, sourceContent) {
        var context = {
          config: config,
          preview: preview,
          request: request,
          requestPath: path,
          sourcePath: sourcePath,
          sourceContent: sourceContent,
        };
        
        return transformer.transform(context);
      });
  }
  
  function normalize (response) {
    if (typeof response === 'string'
      || Buffer.isBuffer(response)) {
        response = {payload: response};
    }
    
    if (!response.encoding) response.encoding = 'utf8';
    if (!response.headers) response.headers = {};
    
    if (!response.headers['content-type']) {
      response.headers['content-type'] = Mime.lookup(requestPath) || 'text/plain';
    }
    
    return response;
  }
};