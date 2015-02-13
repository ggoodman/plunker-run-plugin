module.exports = {
  testFilename: /$/,
  targetExtension: "",
  transform: function (request, reply) {
    // Do nothing, asynchronously
    process.nextTick(function () {
      reply(null, request);
    });
  }
};