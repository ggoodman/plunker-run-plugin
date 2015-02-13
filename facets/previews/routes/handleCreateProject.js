var Cuid = require("cuid");
var Joi = require("joi");
var Previews = require("../../../adapters/previews");
var Promise = require("bluebird");
var _ = require("lodash");



module.exports = {
  validate: {
    params: {
      previewId: Joi.string().alphanum().required(),
    },
    payload: Joi.object().keys({
      entries: Joi.array().includes(Joi.object().keys({
        path: Joi.string().required().regex(/^\/?(?:\.[a-zA-Z0-9]|[a-zA-Z0-9])[\w-]*(?:\.[\w-]+)*(?:\/[a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).required(),
        content: Joi.string().required(),
        encoding: Joi.string().allow("utf8", "base64"),
      })).required(),
    }).required(),
  },
  handler: function (request, reply) {
    var prefix = "preview";
    var key = request.params.previewId || Cuid();
    var entries = _.map(request.payload.entries, function (entry) {
      return {
        path: entry.path.split("/").filter(Boolean).join("/"),
        content: new Buffer(entry.content, entry.encoding),
      };
    });
    
    
    Previews.create(prefix + "." + key, entries)
      .then(function (preview) {
        // Return url
        preview.render(reply, request.params.path || "")
          .catch(reply);
      }, reply);
  }
};