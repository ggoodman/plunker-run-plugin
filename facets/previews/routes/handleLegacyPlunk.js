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
  pre: [{
    method: "previews.fetchLegacyPlunk(params.plunkId)",
    assign: "project",
  }],
  handler: function (request, reply) {
    if (request.path === "/project/" + request.params.plunkId) {
      return reply.redirect("/project/" + request.params.plunkId + "/");
    }
    
    Previews.create(request.pre.project)
      .call("render", request.params.path)
      .then(function(rendered) {
        // console.log("Rendered content", rendered);
        reply(rendered.content)
          .type(rendered.type);
      })
      .catch(function (err) {
        reply(err);
      });
  }
};