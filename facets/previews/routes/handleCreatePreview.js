var Joi = require('joi');
var _ = require('lodash');


module.exports = {
  validate: {
    params: {
      previewId: Joi.string().alphanum().required(),
      path: Joi.string().regex(/^\/?[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).allow('').default('').optional(),
    },
    payload: Joi.object().keys({
      files: Joi.object().pattern(
        /^\/?[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/,
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
      .encoding(rendered.encoding);
      
    _.forEach(rendered.headers, function (val, key) {
      response.header(key, val);
    });
  }
};