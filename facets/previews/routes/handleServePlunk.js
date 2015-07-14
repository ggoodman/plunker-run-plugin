var Joi = require('joi');
var _ = require('lodash');



module.exports = {
  validate: {
    params: {
      plunkId: Joi.string().alphanum().required(),
      path: Joi.string().regex(/^\/?[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).allow('').default('').optional(),
    },
  },
  pre: [{
    method: 'plunks.load(params.plunkId)',
    assign: 'plunk',
  }, {
    method: 'previews.fromPlunk(params.plunkId, pre.plunk)',
    assign: 'preview',
  }, {
    method: 'previews.render',
    assign: 'rendered',
  }],
  handler: function (request, reply) {
    var rendered = request.pre.rendered;
    var response = reply(rendered.payload)
      .etag(request.pre.preview.timestamp)
      .encoding(rendered.encoding);
      
    _.forEach(rendered.headers, function (val, key) {
      response.header(key, val);
    });
  }
};