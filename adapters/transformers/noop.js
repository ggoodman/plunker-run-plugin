module.exports = {
  matches: /$/,
  provides: "",
  transform: function (request, reply) {
    // Do nothing, asynchronously
    process.nextTick(function () {
      reply(null, request);
    });
  }
};