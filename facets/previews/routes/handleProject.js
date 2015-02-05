var Joi = require("joi");
var Previews = require("../../../adapters/previews");
var Promise = require("bluebird");
var Wreck = require("wreck");
var _ = require("lodash");



module.exports = {
  validate: {
    params: {
      plunkId: Joi.string().alphanum().required(),
      path: Joi.string().required().regex(/^(?:\.[a-zA-Z0-9]|[a-zA-Z0-9])[\w-]*(?:\.[\w-]+)*(?:\/[a-zA-Z0-9][\w-]*(?:\.[\w-]+)*)*$/).optional(),
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
      .then(function (preview) {
        preview.render(reply, request.params.path || "")
          .catch(reply);
      }, reply);
  }
};