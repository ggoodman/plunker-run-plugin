var Bluebird = require('bluebird');
var Boom = require('boom');
var Jsonic = require('jsonic');
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
  // typescript: require('./transformers/ts.js'),
};


var transformers = [
  directives.babel,
  // directives.typescript,
  require('./transformers/less.js'),
  require('./transformers/sass.js'),
  require('./transformers/md.js'),
  require('./transformers/coffee.js'),
  require('./transformers/jade.js'),
  require('./transformers/styl.js'),
  require('./transformers/webtask.js'),
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
    .mapKeys(function (content, path) {
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
  
  var candidates = requestPath.slice(-1) === '/' || !requestPath
    ? ['index.html', 'README.html', 'demo.html'].map(function (index) {
      return requestPath + index;
    })
    : [requestPath];
    
  Bluebird
    .map(candidates, render)
    .filter(function (rendered) {
      return typeof rendered !== 'undefined';
    })
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
        var matches = content.match(/^\s*"use (\w+)(?:\(([^"\)]+)\))?";?/);
        
        if (matches && directives[matches[1]]) {
          var directive = directives[matches[1]];
          var compileOptions = {};
          
          if (matches[2]) {
            try {
              compileOptions = Jsonic(matches[2]);
            } catch (e) {
              preview.logs.push({
                source: 'directive options',
                err: e,
              });
            }
          }
          
          if (directive) {
            var context = {
              compileOptions: compileOptions,
              config: config,
              preview: preview,
              request: request,
              requestPath: path,
              sourcePath: path,
              sourceContent: content,
            };
            
            return Bluebird.try(directive.transform, [context], directive)
              .catch(function (err) {
                preview.logs.push({
                  source: directive.name,
                  data: err,
                });
                throw Boom.badRequest('Compilation error: ' + err.message, err);
              });
          }
        }
      }
      
      return {
        headers: {
          'content-type': Mime.lookup(path) || 'text/plain',
        },
        payload: content,
      };
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
        
        return Bluebird.try(transformer.transform, [context], transformer)
          .catch(function (err) {
            preview.logs.push({
              source: transformer.name,
              data: err,
            });
            throw Boom.badRequest('Compilation error: ' + err.message, err);
          });
      })
      .catch(Bluebird.RangeError, function (errs) {
        return;
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