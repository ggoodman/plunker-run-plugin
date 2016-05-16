var Joi = require('joi');
var Schema = require('../schema');
var _ = require('lodash');


module.exports = {
  validate: {
    params: {
      previewId: Joi.string().alphanum().required(),
      path: Schema.pathname.default('').optional(),
    },
    payload: Joi.object().keys({
      sessid: Joi.string().optional(),
      files: Joi.object().pattern(
        Schema.pathname.regex,
        Joi.object().keys({
          content: Joi.string().allow('').required(),
          encoding: Joi.string().allow('utf8').default('utf8').optional(),
        })
      ).min(1).required(),
    }).required()
  },
  pre: [{
    method: 'previews.fromJson(params.previewId, payload)',
    assign: 'preview',
  }, {
    method: 'cache.set(params.previewId, pre.preview, null)',
    assign: 'cached',
  }, {
    method: 'previews.render',
    assign: 'rendered',
  }],
  handler: function (request, reply) {
    var rendered = request.pre.rendered;
    var response = reply(rendered.payload)
      .etag(request.pre.preview.timestamp)
      .header("X-XSS-Protection", 0) // Since we send code over the wire
      .encoding(rendered.encoding);
      
    _.forEach(rendered.headers, function (val, key) {
      response.header(key, val);
    });
    
    var previewId = request.params.previewId;
    var size = parseInt(request.headers['content-length'], 10);
    
    request.visitor.event('previews', 'refresh', previewId, size);
  }
};