var Bluebird = require('bluebird');
var Boom = require('boom');
var Query = require('querystring');
var Wreck = require('wreck');
var _ = require('lodash');

var webtaskToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IjIifQ.eyJqdGkiOiJmODdlNTNkZjc1NTQ0NGM0YjJkY2M2YmJmMmJjMjExMCIsImlhdCI6MTQzNjgwMjc3MSwiY2EiOltdLCJkZCI6MSwidGVuIjoiL15wbHVua2VyLS8ifQ.VAk9_SerUUGd7GlXSUGEgbzidoSyORYAlZxsmFOzsas';

module.exports = {
  matches: /\..+$/,
  provides: ".json",
  transform: function (context) {
    var query = _.extend({}, context.request.query, {
      webtask_url: context.config.shared.url.run
        + (context.preview.type === 'plunk' ? '/plunks' : '')
        + '/' + context.preview.id + '/' + context.requestPath.replace(/\.json$/, '.js'),
    });
    var url = 'https://webtask.it.auth0.com/api/run/plunker-' + context.preview.id
      + '?' + Query.stringify(query);
    var options = {
      headers: _.extend({}, context.request.headers, {
        'Authorization': 'Bearer ' + webtaskToken,
      }),
      rejectUnauthorized: false,
      timeout: 1000 * 5,
    };
    
    if (context.request.payload) {
      options.payload = _.isObject(context.request.payload)
        ? JSON.stringify(context.request.payload)
        : context.request.payload;
    }
    
    return new Bluebird(function (resolve, reject) {
      Wreck.request(context.request.method, url, options, function (err, res) {
        if (err) {
          return reject(Boom.wrap(err, 502, 'Error communicating with webtask.io: ' + err.message));
        }
        
        if (res.statusCode >= 300) {
          return Wreck.read(res, {json: true, timeout: 1000, maxBytes: 1024 * 1024}, function (err, payload) {
            context.preview.logs.push({
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
};
