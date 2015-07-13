var Bluebird = require('bluebird');
var Boom = require('boom');
var Query = require('querystring');
var Wreck = require('wreck');
var _ = require('lodash');

var webtaskToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IjIifQ.eyJqdGkiOiJmODdlNTNkZjc1NTQ0NGM0YjJkY2M2YmJmMmJjMjExMCIsImlhdCI6MTQzNjgwMjc3MSwiY2EiOltdLCJkZCI6MSwidGVuIjoiL15wbHVua2VyLS8ifQ.VAk9_SerUUGd7GlXSUGEgbzidoSyORYAlZxsmFOzsas';

module.exports = {
  matches: /\.js$/,
  provides: ".json",
  transform: function (context) {
    var query = _.extend({}, context.request.query, {
      webtask_url: context.config.shared.url.run
        + (context.preview.type === 'plunk' ? '/plunks' : '')
        + '/' + context.preview.id + '/' + context.sourcePath,
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
        if (res && res.statusCode >= 300) {
          err = Boom.badRequest('Webtask returned an unexpected response: '
            + res.statusCode);
        }
        
        if (err) {
          context.preview.logs.push(err);
          return reject(Boom.badRequest('Webtask failed with error: ' + err.message, err));
        }
        
        resolve({
          payload: res,
          headers: res.headers,
        });
      });
    });
  }
};
