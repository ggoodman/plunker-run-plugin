var Cuid = require("cuid");
var Joi = require("joi");
var Previews = require("../../../adapters/previews");
var Promise = require("bluebird");
var _ = require("lodash");



module.exports = {
  validate: {
    params: {
      previewId: Joi.string().alphanum().required(),
      path: Joi.string().regex(/^\/?[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).allow("").default("").optional(),
    },
    payload: Joi.object().keys({
      files: Joi.object().pattern(
        /^\/?[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/,
        Joi.object().keys({
          content: Joi.string().allow("").required(),
          encoding: Joi.string().allow("utf8").default("utf8").optional(),
        })
      ).min(1).required(),
    }).required()
  },
  handler: function (request, reply) {
    var prefix = "preview";
    var key = request.params.previewId;
    var entries = _.map(request.payload.files, function (entry, path) {
      return {
        path: path.split("/").filter(Boolean).join("/").toLowerCase(),
        content: new Buffer(entry.content, entry.encoding),
      };
    });
    
    
    Previews.create(prefix + "." + key, entries)
      .call("render", request.params.path)
      .then(function(rendered) {
        reply(rendered.content)
          .header("X-XSS-Protection", 0)
          .type(rendered.type);
      })
      .catch(function (err) {
        reply(err);
      });
  }
};