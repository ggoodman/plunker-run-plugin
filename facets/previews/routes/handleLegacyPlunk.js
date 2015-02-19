var Joi = require("joi");
var Previews = require("../../../adapters/previews");
var Promise = require("bluebird");
var Wreck = require("wreck");
var _ = require("lodash");



module.exports = {
  validate: {
    params: {
      plunkId: Joi.string().alphanum().required(),
      path: Joi.string().regex(/^\/?[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*(?:\/[._$a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).allow("").default("").optional(),
    },
  },
  handler: function (request, reply) {
    var prefix = "plunk";
    var key = request.params.plunkId;
    
    if (request.path === "/plunks/" + request.params.plunkId) {
      return reply.redirect("/plunks/" + request.params.plunkId + "/");
    }

    var fetchLegacyPlunk = Promise.promisify(request.server.methods.previews.fetchLegacyPlunk);
    
    Previews.load(prefix, key, fetchLegacyPlunk)
      .call("render", request.params.path)
      .then(function(rendered) {
        reply(rendered.content)
          .type(rendered.type);
      })
      .catch(function (err) {
        reply(err);
      });
  }
};