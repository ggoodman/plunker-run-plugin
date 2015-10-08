var Bluebird = require('bluebird');
var Boom = require('boom');
var Query = require('querystring');
var Sandbox = require('sandboxjs');
var Url = require('url');
var Wreck = Bluebird.promisifyAll(require('wreck'));
var _ = require('lodash');

module.exports = {
  matches: /\..+$/,
  provides: ".json",
  transform: function(context) {
    var config = context.config;
    var webtaskToken = _.get(config, 'webtask.token');
    var webtaskUrl = _.get(config, 'webtask.url');

    return createNamedWebtask()
      .then(runWebtask);


    function createNamedWebtask() {
      var sandbox = Sandbox.init({
        url: webtaskUrl,
        token: webtaskToken,
        container: 'plunker',
      });

      var codeUrl = context.config.shared.url.run + (context.preview.type === 'plunk' ? '/plunks' : '') + '/' + context.preview.id + '/' + context.requestPath.replace(/\.json$/, '.js');

      return sandbox.create(codeUrl, {
        name: context.preview.type + '-' + context.preview.id,
        parse: false,
        merge: false,
      });
    }
    

    function runWebtask(webtask) {
      var url = Url.parse(webtask.url, true);
      var options = {
        rejectUnauthorized: false,
        timeout: 1000 * 5,
      };

      _.extend(url.query, context.request.query);

      if (context.request.payload) {
        options.payload = _.isObject(context.request.payload) ? JSON.stringify(context.request.payload) : context.request.payload;
      }

      return new Bluebird(function(resolve, reject) {
        Wreck.request(context.request.method, Url.format(url), options, function(err, res) {
          if (err) {
            return reject(Boom.wrap(err, 502, 'Error communicating with webtask.io: ' + err.message));
          }

          if (res.statusCode >= 300) {
            return Wreck.read(res, {
              json: true,
              timeout: 1000,
              maxBytes: 1024 * 1024
            }, function(err, payload) {
              if (err) return reject(err);

              context.preview.log({
                source: 'webtask',
                data: payload,
              });

              reject(Boom.badRequest('Error running code on webtask.io', payload));
            });
          }

          resolve({
            payload: res,
            headers: res.headers,
          });
        });
      });
    }
  }
};
