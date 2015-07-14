var Joi = require('joi');
var Stream = require('stream');
var _ = require('lodash');


module.exports = {
  validate: {
    params: {
      previewId: Joi.string().alphanum().required(),
    },
  },
  handler: function (request, reply) {
    var firehose = request.server.plugins.previews.logs;
    var stream = new Stream.PassThrough();
    var response = reply(stream);
    
    firehose.on('log', function (e) {
      stream.push('data: ' + JSON.stringify(e) + '\n');
    });
 
    response.code(200)
      .type("text/event-stream")
      .header("Connection", "keep-alive")
      .header("Cache-Control", "no-cache")
      .header("Content-Encoding", "identity");
  }
};