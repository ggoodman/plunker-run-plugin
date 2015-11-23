var Bluebird = require('bluebird');
var Boom = require('boom');
var Events = require('events');
var Jsonic = require('jsonic');
var Mime = require('mime-types');
var Path = require('path');
var _ = require('lodash');

var logs = new Events.EventEmitter();


exports.register = function (server, options, next) {
  Bluebird.promisifyAll(server);
  
  
  server.log(['info', 'startup'], 'Initializing previews service');
  
  server.bind({
    config: options.config,
  });
  
  server.expose('logs', logs);
  
  server.method('previews.fromCache', Preview.fromCache, {callback: false});
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
  typescript: require('./transformers/typescript.js'),
  traceur: require('./transformers/traceur.js'),
};


var transformers = _.map({
  babel: directives.babel,
  base64: require('./transformers/base64'),
  typescript: directives.typescript,
  traceur: directives.traceur,
  less: require('./transformers/less'),
  sass: require('./transformers/sass'),
  markdown: require('./transformers/md'),
  'coffee-script': require('./transformers/coffee'),
  jade: require('./transformers/jade'),
  stylus: require('./transformers/styl'),
  webtask: require('./transformers/webtask'),
}, function (transformer, name) {
  transformer.name = name;
  return transformer;
});

function Preview (type, id, files, timestamp) {
  this.files = files;
  this.id = id;
  this.type = type;
  this.timestamp = timestamp || Date.now();
}

Preview.prototype.log = function (data) {
  logs.emit('log', {
    type: this.type,
    id: this.id,
    data: data,
  });
};

Preview.fromCache = function (data) {
  if (!data) throw new Boom.notFound('Preview has expired or project does not exist.');
  
  return new Preview(data.type, data.id, data.files, data.timestamp);
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
  
  if (!preview) throw new Boom.notFound('Preview has expired or project does not exist.');
  
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
      throw new Boom.notFound();
    })
    .nodeify(reply);
  
  
  function render (path) {
    var content = preview.files[path];
    
    if (typeof content !== 'undefined') {
      if (Path.extname(path) === '.js') {
        var directiveRx = /^\s*"use (\w+)(?:\s*\(([^"\)]+)\))?";?/;
        var matches = content.match(directiveRx);
        
        if (matches && directives[matches[1]]) {
          var transformer = directives[matches[1]];
          var compileOptions = {};
          
          if (matches[2]) {
            try {
              compileOptions = Jsonic(matches[2]);
            } catch (e) {
              preview.log({
                source: 'directive options',
                err: e,
              });
            }
          }
          
          // Strip out 'use' directive
          content = content.replace(directiveRx, '');
          
          if (transformer) {
            var context = {
              compileOptions: compileOptions,
              config: config,
              preview: preview,
              request: request,
              requestPath: path,
              sourcePath: path,
              sourceContent: content,
            };
            
            request.visitor.event('previews', 'compile:directive', transformer.name, 1);
            
            return Bluebird.try(transformer.transform, [context], transformer)
              .catch(function (err) {
                preview.log({
                  source: transformer.name,
                  data: err,
                });
                throw new Boom.badRequest('Compilation error: ' + err.message, err);
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
          var provides = typeof transformer.provides === 'function'
            ? transformer.provides(sourcePath)
            : transformer.provides;
          var produces = sourcePath
            .replace(transformer.matches, provides);
            
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
          compileOptions: {},
          config: config,
          preview: preview,
          request: request,
          requestPath: path,
          sourcePath: sourcePath,
          sourceContent: sourceContent,
        };
            
        request.visitor.event('previews', 'compile:implicit', transformer.name, 1);
        
        return Bluebird.try(transformer.transform, [context], transformer)
          .catch(function (err) {
            preview.log({
              source: transformer.name,
              data: err,
            });
            throw new Boom.badRequest('Compilation error: ' + err.message, err);
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