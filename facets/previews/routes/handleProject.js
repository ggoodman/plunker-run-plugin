var Joi = require("joi");
var Previews = require("../../../adapters/previews");
var Promise = require("bluebird");
var Wreck = require("wreck");
var _ = require("lodash");



module.exports = {
  validate: {
    params: {
      plunkId: Joi.string().alphanum().required(),
      path: Joi.string().regex(/^\/?(?:\.[a-zA-Z0-9]|[a-zA-Z0-9])[\w-]*(?:\.[\w-]+)*(?:\/[a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).allow("").default("").optional(),
    },
  },
  handler: function (request, reply) {
    var prefix = "project";
    var key = request.params.plunkId;
    
    if (request.path === "/project/" + request.params.plunkId) {
      return reply.redirect("/project/" + request.params.plunkId + "/");
    }

    var fetchProject = Promise.promisify(request.server.methods.previews.fetchProject);
    
    Previews.load(prefix, key, fetchProject)
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